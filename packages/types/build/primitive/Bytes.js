// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { assert, compactAddLength, compactFromU8a, compactToU8a, isString, isU8a, u8aToU8a } from '@axia-js/util';
import { Raw } from "../codec/Raw.js"; // Bytes are used for things like on-chain code, so it has a healthy limit

const MAX_LENGTH = 10 * 1024 * 1024;
/** @internal */

function decodeBytesU8a(value) {
  if (!value.length) {
    return new Uint8Array();
  } // handle all other Uint8Array inputs, these do have a length prefix


  const [offset, length] = compactFromU8a(value);
  const total = offset + length.toNumber();
  assert(length.lten(MAX_LENGTH), () => `Bytes length ${length.toString()} exceeds ${MAX_LENGTH}`);
  assert(total <= value.length, () => `Bytes: required length less than remainder, expected at least ${total}, found ${value.length}`);
  return value.subarray(offset, total);
}
/** @internal */


function decodeBytes(value) {
  if (Array.isArray(value) || isString(value)) {
    return u8aToU8a(value);
  } else if (!(value instanceof Raw) && isU8a(value)) {
    // We are ensuring we are not a Raw instance. In the case of a Raw we already have gotten
    // rid of the length, i.e. new Bytes(new Bytes(...)) will work as expected
    return decodeBytesU8a(value);
  }

  return value;
}
/**
 * @name Bytes
 * @description
 * A Bytes wrapper for Vec<u8>. The significant difference between this and a normal Uint8Array
 * is that this version allows for length-encoding. (i.e. it is a variable-item codec, the same
 * as what is found in [[Text]] and [[Vec]])
 */


export class Bytes extends Raw {
  constructor(registry, value) {
    super(registry, decodeBytes(value));
  }
  /**
   * @description The length of the value when encoded as a Uint8Array
   */


  get encodedLength() {
    return this.length + compactToU8a(this.length).length;
  }
  /**
   * @description Returns the base runtime type name for this instance
   */


  toRawType() {
    return 'Bytes';
  }
  /**
   * @description Encodes the value as a Uint8Array as per the SCALE specifications
   * @param isBare true when the value has none of the type-specific prefixes (internal)
   */


  toU8a(isBare) {
    return isBare ? super.toU8a(isBare) : compactAddLength(this);
  }

}