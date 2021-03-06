"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.member = member;

var _rxjs = require("rxjs");

var _index = require("../util/index.cjs");

// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @description Get the member info for a society
 */
function member(instanceId, api) {
  return (0, _index.memo)(instanceId, accountId => api.derive.society._members([accountId]).pipe((0, _rxjs.map)(_ref => {
    let [result] = _ref;
    return result;
  })));
}