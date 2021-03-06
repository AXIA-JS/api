// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { combineLatest, map, of } from 'rxjs';
import { createHeaderExtended } from "../type/index.js";
import { memo } from "../util/index.js";
/**
 * @name subscribeNewHeads
 * @returns A header with the current header (including extracted author)
 * @description An observable of the current block header and it's author
 * @example
 * <BR>
 *
 * ```javascript
 * api.derive.chain.subscribeNewHeads((header) => {
 *   console.log(`block #${header.number} was authored by ${header.author}`);
 * });
 * ```
 */

export function subscribeNewHeads(instanceId, api) {
  return memo(instanceId, () => combineLatest([api.rpc.chain.subscribeNewHeads(), api.query.session ? api.query.session.validators() : of(undefined)]).pipe(map(([header, validators]) => {
    header.createdAtHash = header.hash;
    return createHeaderExtended(header.registry, header, validators);
  })));
}