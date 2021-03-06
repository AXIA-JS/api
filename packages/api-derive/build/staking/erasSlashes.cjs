"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._eraSlashes = _eraSlashes;
exports._erasSlashes = _erasSlashes;
exports.eraSlashes = eraSlashes;
exports.erasSlashes = erasSlashes;

var _rxjs = require("rxjs");

var _index = require("../util/index.cjs");

// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0
const CACHE_KEY = 'eraSlashes';

function mapSlashes(era, noms, vals) {
  const nominators = {};
  const validators = {};
  noms.forEach(_ref => {
    let [key, optBalance] = _ref;
    nominators[key.args[1].toString()] = optBalance.unwrap();
  });
  vals.forEach(_ref2 => {
    let [key, optRes] = _ref2;
    validators[key.args[1].toString()] = optRes.unwrapOrDefault()[1];
  });
  return {
    era,
    nominators,
    validators
  };
}

function _eraSlashes(instanceId, api) {
  return (0, _index.memo)(instanceId, (era, withActive) => {
    const cacheKey = `${CACHE_KEY}-${era.toString()}`;
    const cached = withActive ? undefined : _index.deriveCache.get(cacheKey);
    return cached ? (0, _rxjs.of)(cached) : (0, _rxjs.combineLatest)([api.query.staking.nominatorSlashInEra.entries(era), api.query.staking.validatorSlashInEra.entries(era)]).pipe((0, _rxjs.map)(_ref3 => {
      let [noms, vals] = _ref3;
      const value = mapSlashes(era, noms, vals);
      !withActive && _index.deriveCache.set(cacheKey, value);
      return value;
    }));
  });
}

function eraSlashes(instanceId, api) {
  return (0, _index.memo)(instanceId, era => api.derive.staking._eraSlashes(era, true));
}

function _erasSlashes(instanceId, api) {
  return (0, _index.memo)(instanceId, (eras, withActive) => eras.length ? (0, _rxjs.combineLatest)(eras.map(era => api.derive.staking._eraSlashes(era, withActive))) : (0, _rxjs.of)([]));
}

function erasSlashes(instanceId, api) {
  return (0, _index.memo)(instanceId, function () {
    let withActive = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    return api.derive.staking.erasHistoric(withActive).pipe((0, _rxjs.switchMap)(eras => api.derive.staking._erasSlashes(eras, withActive)));
  });
}