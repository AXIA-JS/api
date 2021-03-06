import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { combineLatest, map, of, switchMap } from 'rxjs';
import { memo } from "../util/index.js";
import { didUpdateToBool } from "./util.js";

function parse([ids, didUpdate, infos, pendingSwaps, relayDispatchQueueSizes]) {
  return ids.map((id, index) => ({
    didUpdate: didUpdateToBool(didUpdate, id),
    id,
    info: _objectSpread({
      id
    }, infos[index].unwrapOr(null)),
    pendingSwapId: pendingSwaps[index].unwrapOr(null),
    relayDispatchQueueSize: relayDispatchQueueSizes[index][0].toNumber()
  }));
}

export function overview(instanceId, api) {
  return memo(instanceId, () => {
    var _api$query$registrar;

    return (_api$query$registrar = api.query.registrar) !== null && _api$query$registrar !== void 0 && _api$query$registrar.parachains && api.query.parachains ? api.query.registrar.parachains().pipe(switchMap(paraIds => combineLatest([of(paraIds), api.query.parachains.didUpdate(), api.query.registrar.paras.multi(paraIds), api.query.registrar.pendingSwap.multi(paraIds), api.query.parachains.relayDispatchQueueSize.multi(paraIds)])), map(parse)) : of([]);
  });
}