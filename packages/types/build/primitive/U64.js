// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { UInt } from "../codec/UInt.js";
/**
 * @name u64
 * @description
 * A 64-bit unsigned integer
 */

export class u64 extends UInt.with(64) {
  constructor(...args) {
    super(...args);
    this.__UIntType = 'u64';
  }

}