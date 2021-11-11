"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bounties = bounties;

var _rxjs = require("rxjs");

var _index = require("../util/index.cjs");

var _filterBountyProposals = require("./helpers/filterBountyProposals.cjs");

// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0
function parseResult([maybeBounties, maybeDescriptions, ids, bountyProposals]) {
  const bounties = [];
  maybeBounties.forEach((bounty, index) => {
    if (bounty.isSome) {
      bounties.push({
        bounty: bounty.unwrap(),
        description: maybeDescriptions[index].unwrapOrDefault().toUtf8(),
        index: ids[index],
        proposals: bountyProposals.filter(bountyProposal => ids[index].eq(bountyProposal.proposal.args[0]))
      });
    }
  });
  return bounties;
}

function bounties(instanceId, api) {
  const bountyBase = api.query.bounties || api.query.treasury;
  return (0, _index.memo)(instanceId, () => (0, _rxjs.combineLatest)([bountyBase.bountyCount(), api.query.council ? api.query.council.proposalCount() : (0, _rxjs.of)(0)]).pipe((0, _rxjs.switchMap)(() => (0, _rxjs.combineLatest)([bountyBase.bounties.keys(), api.derive.council ? api.derive.council.proposals() : (0, _rxjs.of)([])])), (0, _rxjs.switchMap)(([keys, proposals]) => {
    const ids = keys.map(({
      args: [id]
    }) => id);
    return (0, _rxjs.combineLatest)([bountyBase.bounties.multi(ids), bountyBase.bountyDescriptions.multi(ids), (0, _rxjs.of)(ids), (0, _rxjs.of)((0, _filterBountyProposals.filterBountiesProposals)(api, proposals))]);
  }), (0, _rxjs.map)(parseResult)));
}