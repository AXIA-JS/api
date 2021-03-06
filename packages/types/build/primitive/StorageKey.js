// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { assert, isFunction, isString, isU8a } from '@axia-js/util';
import { Bytes } from "./Bytes.js";
// hasher type -> [initialHashLength, canDecodeKey]
const HASHER_MAP = {
  // opaque
  Blake2_128: [16, false],
  // eslint-disable-line camelcase
  Blake2_128Concat: [16, true],
  // eslint-disable-line camelcase
  Blake2_256: [32, false],
  // eslint-disable-line camelcase
  Identity: [0, true],
  Twox128: [16, false],
  Twox256: [32, false],
  Twox64Concat: [8, true]
};
export function unwrapStorageSi(type) {
  return type.isPlain ? type.asPlain : type.asMap.value;
}
/** @internal */

export function unwrapStorageType(registry, type, isOptional) {
  const typeDef = registry.lookup.getTypeDef(unwrapStorageSi(type));
  const outputType = typeDef.lookupName || typeDef.type;
  return isOptional ? `Option<${outputType}>` : outputType;
}
/** @internal */

function decodeStorageKey(value) {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  if (value instanceof StorageKey) {
    return {
      key: value,
      method: value.method,
      section: value.section
    };
  } else if (!value || isString(value) || isU8a(value)) {
    // let Bytes handle these inputs
    return {
      key: value
    };
  } else if (isFunction(value)) {
    return {
      key: value(),
      method: value.method,
      section: value.section
    };
  } else if (Array.isArray(value)) {
    const [fn, args = []] = value;
    assert(isFunction(fn), 'Expected function input for key construction');
    return {
      key: fn(...args),
      method: fn.method,
      section: fn.section
    };
  }

  throw new Error(`Unable to convert input ${value} to StorageKey`);
}
/** @internal */


function decodeHashers(registry, value, hashers) {
  // the storage entry is xxhashAsU8a(prefix, 128) + xxhashAsU8a(method, 128), 256 bits total
  let offset = 32;
  return hashers.reduce((result, [hasher, type]) => {
    const [hashLen, canDecode] = HASHER_MAP[hasher.type];
    const decoded = canDecode ? registry.createType(registry.createLookupType(type), value.subarray(offset + hashLen)) : registry.createType('Raw', value.subarray(offset, offset + hashLen));
    offset += hashLen + (canDecode ? decoded.encodedLength : 0);
    result.push(decoded);
    return result;
  }, []);
}
/** @internal */


function decodeArgsFromMeta(registry, value, meta) {
  if (!meta || !meta.type.isMap) {
    return [];
  }

  const {
    hashers,
    key
  } = meta.type.asMap;
  const keys = hashers.length === 1 ? [key] : registry.lookup.getSiType(key).def.asTuple;
  return decodeHashers(registry, value, hashers.map((h, i) => [h, keys[i]]));
}
/** @internal */


function getMeta(value) {
  if (value instanceof StorageKey) {
    return value.meta;
  } else if (isFunction(value)) {
    return value.meta;
  } else if (Array.isArray(value)) {
    const [fn] = value;
    return fn.meta;
  }

  return undefined;
}
/** @internal */


function getType(registry, value) {
  if (value instanceof StorageKey) {
    return value.outputType;
  } else if (isFunction(value)) {
    return unwrapStorageType(registry, value.meta.type);
  } else if (Array.isArray(value)) {
    const [fn] = value;

    if (fn.meta) {
      return unwrapStorageType(registry, fn.meta.type);
    }
  } // If we have no type set, default to Raw


  return 'Raw';
}
/**
 * @name StorageKey
 * @description
 * A representation of a storage key (typically hashed) in the system. It can be
 * constructed by passing in a raw key or a StorageEntry with (optional) arguments.
 */


export class StorageKey extends Bytes {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore This is assigned via this.decodeArgsFromMeta()
  constructor(registry, value, override = {}) {
    const {
      key,
      method,
      section
    } = decodeStorageKey(value);
    super(registry, key);
    this._args = void 0;
    this._meta = void 0;
    this._outputType = void 0;
    this._method = void 0;
    this._section = void 0;
    this._outputType = getType(registry, value); // decode the args (as applicable based on the key and the hashers, after all init)

    this.setMeta(getMeta(value), override.section || section, override.method || method);
  }
  /**
   * @description Return the decoded arguments (applicable to map with decodable values)
   */


  get args() {
    return this._args;
  }
  /**
   * @description The metadata or `undefined` when not available
   */


  get meta() {
    return this._meta;
  }
  /**
   * @description The key method or `undefined` when not specified
   */


  get method() {
    return this._method;
  }
  /**
   * @description The output type
   */


  get outputType() {
    return this._outputType;
  }
  /**
   * @description The key section or `undefined` when not specified
   */


  get section() {
    return this._section;
  }

  is(key) {
    return key.section === this.section && key.method === this.method;
  }
  /**
   * @description Sets the meta for this key
   */


  setMeta(meta, section, method) {
    this._meta = meta;
    this._method = method || this._method;
    this._section = section || this._section;

    if (meta) {
      this._outputType = unwrapStorageType(this.registry, meta.type);
    }

    try {
      this._args = decodeArgsFromMeta(this.registry, this.toU8a(true), this.meta);
    } catch (error) {// ignore...
    }

    return this;
  }
  /**
   * @description Returns the Human representation for this type
   */


  toHuman() {
    return this._args.length ? this._args.map(arg => arg.toHuman()) : super.toHuman();
  }
  /**
   * @description Returns the raw type for this
   */


  toRawType() {
    return 'StorageKey';
  }

}