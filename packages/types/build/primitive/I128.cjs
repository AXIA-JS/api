"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.i128 = void 0;

var _Int = require("../codec/Int.cjs");

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @name i128
 * @description
 * A 128-bit signed integer
 */
class i128 extends _Int.Int.with(128) {
  constructor() {
    super(...arguments);
    this.__IntType = 'i128';
  }

}

exports.i128 = i128;