"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._eraExposure = _eraExposure;
exports._erasExposure = _erasExposure;
exports.eraExposure = eraExposure;
exports.erasExposure = erasExposure;

var _rxjs = require("rxjs");

var _index = require("../util/index.cjs");

// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0
const CACHE_KEY = 'eraExposure';

function mapStakers(era, stakers) {
  const nominators = {};
  const validators = {};
  stakers.forEach(_ref => {
    let [key, exposure] = _ref;
    const validatorId = key.args[1].toString();
    validators[validatorId] = exposure;
    exposure.others.forEach((_ref2, validatorIndex) => {
      let {
        who
      } = _ref2;
      const nominatorId = who.toString();
      nominators[nominatorId] = nominators[nominatorId] || [];
      nominators[nominatorId].push({
        validatorId,
        validatorIndex
      });
    });
  });
  return {
    era,
    nominators,
    validators
  };
}

function _eraExposure(instanceId, api) {
  return (0, _index.memo)(instanceId, (era, withActive) => {
    const cacheKey = `${CACHE_KEY}-${era.toString()}`;
    const cached = withActive ? undefined : _index.deriveCache.get(cacheKey);
    return cached ? (0, _rxjs.of)(cached) : api.query.staking.erasStakersClipped.entries(era).pipe((0, _rxjs.map)(stakers => {
      const value = mapStakers(era, stakers);
      !withActive && _index.deriveCache.set(cacheKey, value);
      return value;
    }));
  });
}

function eraExposure(instanceId, api) {
  return (0, _index.memo)(instanceId, era => api.derive.staking._eraExposure(era, true));
}

function _erasExposure(instanceId, api) {
  return (0, _index.memo)(instanceId, (eras, withActive) => eras.length ? (0, _rxjs.combineLatest)(eras.map(era => api.derive.staking._eraExposure(era, withActive))) : (0, _rxjs.of)([]));
}

function erasExposure(instanceId, api) {
  return (0, _index.memo)(instanceId, function () {
    let withActive = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    return api.derive.staking.erasHistoric(withActive).pipe((0, _rxjs.switchMap)(eras => api.derive.staking._erasExposure(eras, withActive)));
  });
}