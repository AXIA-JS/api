"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSignedBlockExtended = createSignedBlockExtended;

var _classPrivateFieldLooseBase2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseBase"));

var _classPrivateFieldLooseKey2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseKey"));

var _util = require("./util.cjs");

// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0
function mapExtrinsics(extrinsics, records) {
  return extrinsics.map((extrinsic, index) => {
    let dispatchError;
    let dispatchInfo;
    const events = records.filter(_ref => {
      let {
        phase
      } = _ref;
      return phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index);
    }).map(_ref2 => {
      let {
        event
      } = _ref2;

      if (event.section === 'system') {
        if (event.method === 'ExtrinsicSuccess') {
          dispatchInfo = event.data[0];
        } else if (event.method === 'ExtrinsicFailed') {
          dispatchError = event.data[0];
          dispatchInfo = event.data[1];
        }
      }

      return event;
    });
    return {
      dispatchError,
      dispatchInfo,
      events,
      extrinsic
    };
  });
}

function createSignedBlockExtended(registry, block, events, validators) {
  // an instance of the base extrinsic for us to extend
  const SignedBlockBase = registry.createClass('SignedBlock');

  var _author = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("author");

  var _events = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("events");

  var _extrinsics = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extrinsics");

  class Implementation extends SignedBlockBase {
    constructor(registry, block, events, validators) {
      super(registry, block);
      Object.defineProperty(this, _author, {
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, _events, {
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, _extrinsics, {
        writable: true,
        value: void 0
      });
      (0, _classPrivateFieldLooseBase2.default)(this, _author)[_author] = (0, _util.extractAuthor)(this.block.header.digest, validators);
      (0, _classPrivateFieldLooseBase2.default)(this, _events)[_events] = events || [];
      (0, _classPrivateFieldLooseBase2.default)(this, _extrinsics)[_extrinsics] = mapExtrinsics(this.block.extrinsics, (0, _classPrivateFieldLooseBase2.default)(this, _events)[_events]);
      this.createdAtHash = block === null || block === void 0 ? void 0 : block.createdAtHash;
    }
    /**
     * @description Convenience method, returns the author for the block
     */


    get author() {
      return (0, _classPrivateFieldLooseBase2.default)(this, _author)[_author];
    }
    /**
     * @description Convenience method, returns the events associated with the block
     */


    get events() {
      return (0, _classPrivateFieldLooseBase2.default)(this, _events)[_events];
    }
    /**
     * @description Returns the extrinsics and their events, mapped
     */


    get extrinsics() {
      return (0, _classPrivateFieldLooseBase2.default)(this, _extrinsics)[_extrinsics];
    }

  }

  return new Implementation(registry, block, events, validators);
}