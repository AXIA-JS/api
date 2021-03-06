// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { compactToU8a, u8aConcat, u8aToHex } from '@axia-js/util';
import { compareArray } from "./utils/compareArray.js";
/**
 * @name AbstractArray
 * @description
 * This manages codec arrays. It is an extension to Array, providing
 * specific encoding/decoding on top of the base type.
 * @noInheritDoc
 */

export class AbstractArray extends Array {
  constructor(registry, values) {
    super(values.length);
    this.registry = void 0;
    this.createdAtHash = void 0;

    for (let i = 0; i < values.length; i++) {
      this[i] = values[i];
    }

    this.registry = registry;
  }
  /**
   * @description The length of the value when encoded as a Uint8Array
   */


  get encodedLength() {
    return this.reduce((total, entry) => total + entry.encodedLength, compactToU8a(this.length).length);
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
    return this.length === 0;
  }
  /**
   * @description The length of the value
   */


  get length() {
    // only included here since we ignore inherited docs
    return super.length;
  }
  /**
   * @description Compares the value of the input to see if there is a match
   */


  eq(other) {
    return compareArray(this, other);
  }
  /**
   * @description Converts the Object to an standard JavaScript Array
   */


  toArray() {
    return Array.from(this);
  }
  /**
   * @description Returns a hex string representation of the value
   */


  toHex() {
    return u8aToHex(this.toU8a());
  }
  /**
   * @description Converts the Object to to a human-friendly JSON, with additional fields, expansion and formatting of information
   */


  toHuman(isExtended) {
    return this.map(entry => entry.toHuman(isExtended));
  }
  /**
   * @description Converts the Object to JSON, typically used for RPC transfers
   */


  toJSON() {
    return this.map(entry => entry.toJSON());
  }
  /**
   * @description Returns the base runtime type name for this instance
   */


  /**
   * @description Returns the string representation of the value
   */
  toString() {
    // Overwrite the default toString representation of Array.
    const data = this.map(entry => entry.toString());
    return `[${data.join(', ')}]`;
  }
  /**
   * @description Encodes the value as a Uint8Array as per the SCALE specifications
   * @param isBare true when the value has none of the type-specific prefixes (internal)
   */


  toU8a(isBare) {
    const encoded = this.map(entry => entry.toU8a(isBare));
    return isBare ? u8aConcat(...encoded) : u8aConcat(compactToU8a(this.length), ...encoded);
  } // Below are methods that we override. When we do a `new Vec(...).map()`,
  // we want it to return an Array. We only override the methods that return a
  // new instance.

  /**
   * @description Concatenates two arrays
   */


  concat(other) {
    return this.toArray().concat(other instanceof AbstractArray ? other.toArray() : other);
  }
  /**
   * @description Filters the array with the callback
   */


  filter(callbackfn, thisArg) {
    return this.toArray().filter(callbackfn, thisArg);
  }
  /**
   * @description Maps the array with the callback
   */


  map(callbackfn, thisArg) {
    return this.toArray().map(callbackfn, thisArg);
  }
  /**
   * @description Checks if the array includes a specific value
   */


  includes(check) {
    return this.some(value => value.eq(check));
  }
  /**
   * @description Returns a slice of an array
   */


  slice(start, end) {
    return this.toArray().slice(start, end);
  }

}