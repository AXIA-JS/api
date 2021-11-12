"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStorage = getStorage;

var _substrate = require("./substrate.cjs");

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0

/** @internal */
function getStorage(registry) {
  return {
    substrate: Object.entries(_substrate.substrate).reduce((storage, _ref) => {
      let [key, fn] = _ref;
      storage[key] = fn(registry);
      return storage;
    }, {})
  };
}