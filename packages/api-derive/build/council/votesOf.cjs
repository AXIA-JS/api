"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.votesOf = votesOf;

var _rxjs = require("rxjs");

var _index = require("../util/index.cjs");

// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0
function votesOf(instanceId, api) {
  return (0, _index.memo)(instanceId, accountId => api.derive.council.votes().pipe((0, _rxjs.map)(votes => (votes.find(_ref => {
    let [from] = _ref;
    return from.eq(accountId);
  }) || [null, {
    stake: api.registry.createType('Balance'),
    votes: []
  }])[1])));
}