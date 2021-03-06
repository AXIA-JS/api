"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.typeToConstructor = typeToConstructor;

var _util = require("@axia-js/util");

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
function typeToConstructor(registry, type) {
  return (0, _util.isString)(type) ? registry.createClass(type) : type;
}