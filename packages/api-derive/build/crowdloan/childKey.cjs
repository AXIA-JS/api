"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.childKey = childKey;

var _rxjs = require("rxjs");

var _util = require("@axia-js/util");

var _utilCrypto = require("@axia-js/util-crypto");

var _index = require("../util/index.cjs");

// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0
function createChildKey(_ref) {
  let {
    trieIndex
  } = _ref;
  return (0, _util.u8aToHex)((0, _util.u8aConcat)(':child_storage:default:', (0, _utilCrypto.blake2AsU8a)((0, _util.u8aConcat)('crowdloan', trieIndex.toU8a()))));
}

function childKey(instanceId, api) {
  return (0, _index.memo)(instanceId, paraId => api.query.crowdloan.funds(paraId).pipe((0, _rxjs.map)(optInfo => optInfo.isSome ? createChildKey(optInfo.unwrap()) : null)));
}