import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Copyright 2017-2021 @axia-js/types-known authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable sort-keys */
const sharedTypes = {
  // 16 validators
  CompactAssignments: 'CompactAssignmentsWith16',
  RawSolution: 'RawSolutionWith16',
  // general
  Keys: 'SessionKeys6',
  ProxyType: {
    _enum: ['Any', 'NonTransfer', 'Staking', 'SudoBalances', 'IdentityJudgement', 'CancelProxy']
  }
};
const addrAccountIdTypes = {
  AccountInfo: 'AccountInfoWithRefCount',
  Address: 'AccountId',
  CompactAssignments: 'CompactAssignmentsWith16',
  LookupSource: 'AccountId',
  Keys: 'SessionKeys5',
  RawSolution: 'RawSolutionWith16',
  ValidatorPrefs: 'ValidatorPrefsWithCommission'
};
const versioned = [{
  minmax: [1, 2],
  types: _objectSpread(_objectSpread(_objectSpread({}, sharedTypes), addrAccountIdTypes), {}, {
    CompactAssignments: 'CompactAssignmentsTo257',
    DispatchInfo: 'DispatchInfoTo244',
    Heartbeat: 'HeartbeatTo244',
    Multiplier: 'Fixed64',
    OpenTip: 'OpenTipTo225',
    RefCount: 'RefCountTo259',
    Weight: 'u32'
  })
}, {
  minmax: [3, 22],
  types: _objectSpread(_objectSpread(_objectSpread({}, sharedTypes), addrAccountIdTypes), {}, {
    CompactAssignments: 'CompactAssignmentsTo257',
    DispatchInfo: 'DispatchInfoTo244',
    Heartbeat: 'HeartbeatTo244',
    OpenTip: 'OpenTipTo225',
    RefCount: 'RefCountTo259'
  })
}, {
  minmax: [23, 42],
  types: _objectSpread(_objectSpread(_objectSpread({}, sharedTypes), addrAccountIdTypes), {}, {
    CompactAssignments: 'CompactAssignmentsTo257',
    DispatchInfo: 'DispatchInfoTo244',
    Heartbeat: 'HeartbeatTo244',
    RefCount: 'RefCountTo259'
  })
}, {
  minmax: [43, 44],
  types: _objectSpread(_objectSpread(_objectSpread({}, sharedTypes), addrAccountIdTypes), {}, {
    DispatchInfo: 'DispatchInfoTo244',
    Heartbeat: 'HeartbeatTo244',
    RefCount: 'RefCountTo259'
  })
}, {
  minmax: [45, 47],
  types: _objectSpread(_objectSpread({}, sharedTypes), addrAccountIdTypes)
}, {
  minmax: [48, 49],
  types: _objectSpread(_objectSpread({}, sharedTypes), {}, {
    AccountInfo: 'AccountInfoWithDualRefCount'
  })
}, {
  minmax: [50, undefined],
  types: _objectSpread(_objectSpread({}, sharedTypes), {}, {
    AssetInstance: 'AssetInstanceV0',
    MultiAsset: 'MultiAssetV0',
    MultiLocation: 'MultiLocationV0',
    Response: 'ResponseV0',
    Xcm: 'XcmV0',
    XcmOrder: 'XcmOrderV0'
  })
}];
export default versioned;