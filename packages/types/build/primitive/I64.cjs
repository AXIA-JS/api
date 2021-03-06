"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.i64 = void 0;

var _Int = require("../codec/Int.cjs");

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @name i64
 * @description
 * A 64-bit signed integer
 */
class i64 extends _Int.Int.with(64) {
  constructor() {
    super(...arguments);
    this.__IntType = 'i64';
  }

}

exports.i64 = i64;