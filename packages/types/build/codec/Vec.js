// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { assert, compactFromU8a, logger, u8aToU8a } from '@axia-js/util';
import { AbstractArray } from "./AbstractArray.js";
import { decodeU8a, typeToConstructor } from "./utils/index.js";
const MAX_LENGTH = 64 * 1024;
const l = logger('Vec');
/**
 * @name Vec
 * @description
 * This manages codec arrays. Internally it keeps track of the length (as decoded) and allows
 * construction with the passed `Type` in the constructor. It is an extension to Array, providing
 * specific encoding/decoding on top of the base type.
 */

export class Vec extends AbstractArray {
  constructor(registry, Type, value = []) {
    const Clazz = typeToConstructor(registry, Type);
    super(registry, Vec.decodeVec(registry, Clazz, value));
    this._Type = void 0;
    this._Type = Clazz;
  }
  /** @internal */


  static decodeVec(registry, Type, value) {
    if (Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return value.map((entry, index) => {
        try {
          return entry instanceof Type ? entry : new Type(registry, entry);
        } catch (error) {
          l.error(`Unable to decode on index ${index}`, error.message);
          throw error;
        }
      });
    }

    const u8a = u8aToU8a(value);
    const [offset, length] = compactFromU8a(u8a);
    assert(length.lten(MAX_LENGTH), () => `Vec length ${length.toString()} exceeds ${MAX_LENGTH}`);
    return decodeU8a(registry, u8a.subarray(offset), new Array(length.toNumber()).fill(Type));
  }

  static with(Type) {
    return class extends Vec {
      constructor(registry, value) {
        super(registry, Type, value);
      }

    };
  }
  /**
   * @description The type for the items
   */


  get Type() {
    return this._Type.name;
  }
  /**
   * @description Finds the index of the value in the array
   */


  indexOf(_other) {
    // convert type first, this removes overhead from the eq
    const other = _other instanceof this._Type ? _other : new this._Type(this.registry, _other);

    for (let i = 0; i < this.length; i++) {
      if (other.eq(this[i])) {
        return i;
      }
    }

    return -1;
  }
  /**
   * @description Returns the base runtime type name for this instance
   */


  toRawType() {
    return `Vec<${this.registry.getClassName(this._Type) || new this._Type(this.registry).toRawType()}>`;
  }

}