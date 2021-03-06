// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { combineLatest, map, of, switchMap } from 'rxjs';
import { memo } from "../util/index.js";

function extractsIds(stashId, queuedKeys, nextKeys) {
  const sessionIds = (queuedKeys.find(([currentId]) => currentId.eq(stashId)) || [undefined, []])[1];
  const nextSessionIds = nextKeys.unwrapOr([]);
  return {
    nextSessionIds,
    sessionIds
  };
}

export function keys(instanceId, api) {
  return memo(instanceId, stashId => api.derive.staking.keysMulti([stashId]).pipe(map(([first]) => first)));
}
export function keysMulti(instanceId, api) {
  return memo(instanceId, stashIds => stashIds.length ? api.query.session.queuedKeys().pipe(switchMap(queuedKeys => {
    var _api$consts$session;

    return combineLatest([of(queuedKeys), (_api$consts$session = api.consts.session) !== null && _api$consts$session !== void 0 && _api$consts$session.dedupKeyPrefix ? api.query.session.nextKeys.multi(stashIds.map(stashId => [api.consts.session.dedupKeyPrefix, stashId])) : api.query.session.nextKeys.multi(stashIds)]);
  }), map(([queuedKeys, nextKeys]) => stashIds.map((stashId, index) => extractsIds(stashId, queuedKeys, nextKeys[index])))) : of([]));
}