// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { assert, isNumber, isUndefined, stringify } from '@axia-js/util';
import { BTreeMap, BTreeSet, CodecSet, Compact, DoNotConstruct, Enum, HashMap, Int, Option, Range, RangeInclusive, Result, Struct, Tuple, U8aFixed, UInt, Vec, VecFixed } from "../codec/index.js";
import { Bytes, Null } from "../primitive/index.js";
import { getTypeDef } from "./getTypeDef.js";
import { TypeDefInfo } from "./types.js";

function getSubDefArray(value) {
  assert(value.sub && Array.isArray(value.sub), () => `Expected subtype as TypeDef[] in ${stringify(value)}`);
  return value.sub;
}

function getSubDef(value) {
  assert(value.sub && !Array.isArray(value.sub), () => `Expected subtype as TypeDef in ${stringify(value)}`);
  return value.sub;
}

function getSubType(value) {
  return getSubDef(value).type;
} // create a maps of type string constructors from the input


function getTypeClassMap(value) {
  const result = {};
  return getSubDefArray(value).reduce((result, sub) => {
    result[sub.name] = sub.type;
    return result;
  }, result);
} // create an array of type string constructors from the input


function getTypeClassArray(value) {
  return getSubDefArray(value).map(({
    type
  }) => type);
}

function createInt({
  displayName,
  length
}, Clazz) {
  assert(isNumber(length), () => `Expected bitLength information for ${displayName || Clazz.constructor.name}<bitLength>`);
  return Clazz.with(length, displayName);
}

function createHashMap(value, Clazz) {
  const [keyType, valueType] = getTypeClassArray(value);
  return Clazz.with(keyType, valueType);
}

const infoMapping = {
  [TypeDefInfo.BTreeMap]: (registry, value) => createHashMap(value, BTreeMap),
  [TypeDefInfo.BTreeSet]: (registry, value) => BTreeSet.with(getSubType(value)),
  [TypeDefInfo.Compact]: (registry, value) => Compact.with(getSubType(value)),
  [TypeDefInfo.DoNotConstruct]: (registry, value) => DoNotConstruct.with(value.displayName || value.type),
  [TypeDefInfo.Enum]: (registry, value) => {
    const subs = getSubDefArray(value);
    return Enum.with(subs.every(({
      type
    }) => type === 'Null') ? subs.reduce((out, {
      index,
      name
    }, count) => {
      out[name] = index || count;
      return out;
    }, {}) : getTypeClassMap(value));
  },
  [TypeDefInfo.HashMap]: (registry, value) => createHashMap(value, HashMap),
  [TypeDefInfo.Int]: (registry, value) => createInt(value, Int),
  // We have circular deps between Linkage & Struct
  [TypeDefInfo.Linkage]: (registry, value) => {
    const type = `Option<${getSubType(value)}>`; // eslint-disable-next-line sort-keys

    const Clazz = Struct.with({
      previous: type,
      next: type
    }); // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access

    Clazz.prototype.toRawType = function () {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      return `Linkage<${this.next.toRawType(true)}>`;
    };

    return Clazz;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [TypeDefInfo.Null]: (registry, _) => Null,
  [TypeDefInfo.Option]: (registry, value) => Option.with(getSubType(value)),
  [TypeDefInfo.Plain]: (registry, value) => registry.getOrUnknown(value.type),
  [TypeDefInfo.Range]: (registry, value) => (value.type.includes('RangeInclusive') ? RangeInclusive : Range).with(getSubType(value)),
  [TypeDefInfo.Result]: (registry, value) => {
    const [Ok, Err] = getTypeClassArray(value); // eslint-disable-next-line @typescript-eslint/no-use-before-define

    return Result.with({
      Err,
      Ok
    });
  },
  [TypeDefInfo.Set]: (registry, value) => {
    const result = {};
    return CodecSet.with(getSubDefArray(value).reduce((result, {
      index,
      name
    }) => {
      result[name] = index;
      return result;
    }, result), value.length);
  },
  [TypeDefInfo.Si]: (registry, value) => getTypeClass(registry, registry.lookup.getTypeDef(value.type)),
  [TypeDefInfo.Struct]: (registry, value) => Struct.with(getTypeClassMap(value), value.alias),
  [TypeDefInfo.Tuple]: (registry, value) => Tuple.with(getTypeClassArray(value)),
  [TypeDefInfo.UInt]: (registry, value) => createInt(value, UInt),
  [TypeDefInfo.Vec]: (registry, value) => {
    const subType = getSubType(value);
    return subType === 'u8' ? Bytes : Vec.with(subType);
  },
  [TypeDefInfo.VecFixed]: (registry, {
    displayName,
    length,
    sub
  }) => {
    assert(isNumber(length) && !isUndefined(sub), 'Expected length & type information for fixed vector');
    const subType = sub.type;
    return subType === 'u8' ? U8aFixed.with(length * 8, displayName) : VecFixed.with(subType, length);
  }
}; // Returns the type Class for construction

export function getTypeClass(registry, typeDef) {
  let Type = registry.get(typeDef.type);

  if (Type) {
    return Type;
  }

  try {
    Type = infoMapping[typeDef.info](registry, typeDef);
    assert(Type, 'No class created'); // don't clobber any existing

    if (!Type.__fallbackType && typeDef.fallbackType) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore ...this is the only place we we actually assign this...
      Type.__fallbackType = typeDef.fallbackType;
    }

    return Type;
  } catch (error) {
    throw new Error(`Unable to construct class from ${stringify(typeDef)}: ${error.message}`);
  }
}
export function createClass(registry, type) {
  return getTypeClass(registry, registry.isLookupType(type) ? registry.lookup.getTypeDef(type) : getTypeDef(type));
}