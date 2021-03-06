"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.subscribeNewBlocks = subscribeNewBlocks;

var _rxjs = require("rxjs");

var _index = require("../type/index.cjs");

var _index2 = require("../util/index.cjs");

// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @name subscribeNewBlocks
 * @returns The latest block & events for that block
 */
function subscribeNewBlocks(instanceId, api) {
  return (0, _index2.memo)(instanceId, () => api.derive.chain.subscribeNewHeads().pipe((0, _rxjs.switchMap)(header => {
    const blockHash = header.createdAtHash || header.hash;
    return (0, _rxjs.combineLatest)(api.rpc.chain.getBlock(blockHash), api.query.system.events.at(blockHash), (0, _rxjs.of)(header));
  }), (0, _rxjs.map)(_ref => {
    let [block, events, header] = _ref;
    return (0, _index.createSignedBlockExtended)(block.registry, block, events, header.validators);
  })));
}