"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.filterEvents = filterEvents;

var _logging = require("./logging.cjs");

// Copyright 2017-2021 @axia-js/api authors & contributors
// SPDX-License-Identifier: Apache-2.0
function filterEvents(extHash, _ref, allEvents, status) {
  let {
    block: {
      extrinsics,
      header
    }
  } = _ref;
  // extrinsics to hashes
  const myHash = extHash.toHex();
  const allHashes = extrinsics.map(ext => ext.hash.toHex()); // find the index of our extrinsic in the block

  const index = allHashes.indexOf(myHash); // if we do get the block after finalized, it _should_ be there

  if (index === -1) {
    // only warn on filtering with isInBlock (finalization finalizes after)
    if (status.isInBlock) {
      _logging.l.warn(`block ${header.hash.toHex()}: Unable to find extrinsic ${myHash} inside ${allHashes.join(', ')}`);
    }

    return;
  }

  return allEvents.filter(_ref2 => {
    let {
      phase
    } = _ref2;
    return (// only ApplyExtrinsic has the extrinsic index
      phase.isApplyExtrinsic && phase.asApplyExtrinsic.eqn(index)
    );
  });
}