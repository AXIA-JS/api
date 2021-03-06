// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { combineLatest, map, of, switchMap } from 'rxjs';
import { deriveCache, memo } from "../util/index.js";
const CACHE_KEY = 'eraExposure';

function mapStakers(era, stakers) {
  const nominators = {};
  const validators = {};
  stakers.forEach(([key, exposure]) => {
    const validatorId = key.args[1].toString();
    validators[validatorId] = exposure;
    exposure.others.forEach(({
      who
    }, validatorIndex) => {
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

export function _eraExposure(instanceId, api) {
  return memo(instanceId, (era, withActive) => {
    const cacheKey = `${CACHE_KEY}-${era.toString()}`;
    const cached = withActive ? undefined : deriveCache.get(cacheKey);
    return cached ? of(cached) : api.query.staking.erasStakersClipped.entries(era).pipe(map(stakers => {
      const value = mapStakers(era, stakers);
      !withActive && deriveCache.set(cacheKey, value);
      return value;
    }));
  });
}
export function eraExposure(instanceId, api) {
  return memo(instanceId, era => api.derive.staking._eraExposure(era, true));
}
export function _erasExposure(instanceId, api) {
  return memo(instanceId, (eras, withActive) => eras.length ? combineLatest(eras.map(era => api.derive.staking._eraExposure(era, withActive))) : of([]));
}
export function erasExposure(instanceId, api) {
  return memo(instanceId, (withActive = false) => api.derive.staking.erasHistoric(withActive).pipe(switchMap(eras => api.derive.staking._erasExposure(eras, withActive))));
}