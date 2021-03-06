"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasProposals = hasProposals;
exports.proposal = proposal;
exports.proposalCount = proposalCount;
exports.proposalHashes = proposalHashes;
exports.proposals = proposals;

var _rxjs = require("rxjs");

var _util = require("@axia-js/util");

var _index = require("../util/index.cjs");

var _getInstance = require("./getInstance.cjs");

// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0
function parse(api, _ref) {
  let [hashes, proposals, votes] = _ref;
  return proposals.map((proposalOpt, index) => proposalOpt && proposalOpt.isSome ? {
    hash: api.registry.createType('Hash', hashes[index]),
    proposal: proposalOpt.unwrap(),
    votes: votes[index].unwrapOr(null)
  } : null).filter(proposal => !!proposal);
}

function _proposalsFrom(instanceId, api, section) {
  return (0, _index.memo)(instanceId, hashes => {
    var _api$query$section;

    return ((0, _util.isFunction)((_api$query$section = api.query[section]) === null || _api$query$section === void 0 ? void 0 : _api$query$section.proposals) && hashes.length ? (0, _rxjs.combineLatest)([(0, _rxjs.of)(hashes), // this should simply be api.query[section].proposalOf.multi<Option<Proposal>>(hashes),
    // however we have had cases on Edgeware where the indices have moved around after an
    // upgrade, which results in invalid on-chain data
    (0, _rxjs.combineLatest)(hashes.map(hash => // this should simply be api.query[section].proposalOf.multi<Option<Proposal>>(hashes),
    // however we have had cases on Edgeware where the indices have moved around after an
    // upgrade, which results in invalid on-chain data
    api.query[section].proposalOf(hash).pipe((0, _rxjs.catchError)(() => (0, _rxjs.of)(null))))), api.query[section].voting.multi(hashes)]) : (0, _rxjs.of)([[], [], []])).pipe((0, _rxjs.map)(result => parse(api, result)));
  });
}

function hasProposals(instanceId, api, _section) {
  const section = (0, _getInstance.getInstance)(api, _section);
  return (0, _index.memo)(instanceId, () => {
    var _api$query$section2;

    return (0, _rxjs.of)((0, _util.isFunction)((_api$query$section2 = api.query[section]) === null || _api$query$section2 === void 0 ? void 0 : _api$query$section2.proposals));
  });
}

function proposalCount(instanceId, api, _section) {
  const section = (0, _getInstance.getInstance)(api, _section);
  return (0, _index.memo)(instanceId, () => (0, _util.isFunction)(api.query[section].proposalCount) ? api.query[section].proposalCount() : (0, _rxjs.of)(null));
}

function proposalHashes(instanceId, api, _section) {
  const section = (0, _getInstance.getInstance)(api, _section);
  return (0, _index.memo)(instanceId, () => {
    var _api$query$section3;

    return (0, _util.isFunction)((_api$query$section3 = api.query[section]) === null || _api$query$section3 === void 0 ? void 0 : _api$query$section3.proposals) ? api.query[section].proposals() : (0, _rxjs.of)([]);
  });
}

function proposals(instanceId, api, _section) {
  const section = (0, _getInstance.getInstance)(api, _section);

  const proposalsFrom = _proposalsFrom(instanceId, api, section);

  const getHashes = proposalHashes(instanceId, api, _section);
  return (0, _index.memo)(instanceId, () => getHashes().pipe((0, _rxjs.switchMap)(proposalsFrom)));
}

function proposal(instanceId, api, _section) {
  const section = (0, _getInstance.getInstance)(api, _section);

  const proposalsFrom = _proposalsFrom(instanceId, api, section);

  return (0, _index.memo)(instanceId, hash => {
    var _api$query$section4;

    return (0, _util.isFunction)((_api$query$section4 = api.query[section]) === null || _api$query$section4 === void 0 ? void 0 : _api$query$section4.proposals) ? proposalsFrom([hash]).pipe((0, _rxjs.map)(_ref2 => {
      let [proposal] = _ref2;
      return proposal;
    })) : (0, _rxjs.of)(null);
  });
}