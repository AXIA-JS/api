// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { isFunction, isUndefined, stringify } from '@axia-js/util';
import { compareMap } from "./utils/index.js";
/** @internal */

function decodeJson(value) {
  return Object.entries(value || {});
}
/**
 * @name Json
 * @description
 * Wraps the a JSON structure retrieve via RPC. It extends the standard JS Map with. While it
 * implements a Codec, it is limited in that it can only be used with input objects via RPC,
 * i.e. no hex decoding. Unlike a struct, this waps a JSON object with unknown keys
 * @noInheritDoc
 */


export class Json extends Map {
  constructor(registry, value) {
    const decoded = decodeJson(value);
    super(decoded);
    this.registry = void 0;
    this.createdAtHash = void 0;
    this.registry = registry;
    decoded.forEach(([key]) => {
      isUndefined(this[key]) && Object.defineProperty(this, key, {
        enumerable: true,
        get: () => this.get(key)
      });
    });
  }
  /**
   * @description Always 0, never encodes as a Uint8Array
   */


  get encodedLength() {
    return 0;
  }
  /**
   * @description returns a hash of the contents
   */


  get hash() {
    return this.registry.hash(this.toU8a());
  }
  /**
   * @description Checks if the value is an empty value
   */


  get isEmpty() {
    return [...this.keys()].length === 0;
  }
  /**
   * @description Compares the value of the input to see if there is a match
   */


  eq(other) {
    return compareMap(this, other);
  }
  /**
   * @description Unimplemented, will throw
   */


  toHex() {
    throw new Error('Unimplemented');
  }
  /**
   * @description Converts the Object to to a human-friendly JSON, with additional fields, expansion and formatting of information
   */


  toHuman() {
    return [...this.entries()].reduce((json, [key, value]) => {
      json[key] = isFunction(value.toHuman) ? value.toHuman() : value;
      return json;
    }, {});
  }
  /**
   * @description Converts the Object to JSON, typically used for RPC transfers
   */


  toJSON() {
    return [...this.entries()].reduce((json, [key, value]) => {
      json[key] = value;
      return json;
    }, {});
  }
  /**
   * @description Returns the base runtime type name for this instance
   */


  toRawType() {
    return 'Json';
  }
  /**
   * @description Returns the string representation of the value
   */


  toString() {
    return stringify(this.toJSON());
  }
  /**
   * @description Unimplemented, will throw
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars


  toU8a(isBare) {
    throw new Error('Unimplemented');
  }

}