"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.i32 = void 0;

var _Int = require("../codec/Int.cjs");

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @name i32
 * @description
 * A 32-bit signed integer
 */
class i32 extends _Int.Int.with(32) {
  constructor() {
    super(...arguments);
    this.__IntType = 'i32';
  }

}

exports.i32 = i32;