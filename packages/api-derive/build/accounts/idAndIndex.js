// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { map, of } from 'rxjs';
import { isU8a } from '@axia-js/util';
import { decodeAddress } from '@axia-js/util-crypto';
import { memo } from "../util/index.js";

function retrieve(api, address) {
  try {
    // yes, this can fail, don't care too much, catch will catch it
    const decoded = isU8a(address) ? address : decodeAddress((address || '').toString());

    if (decoded.length > 8) {
      const accountId = api.registry.createType('AccountId', decoded);
      return api.derive.accounts.idToIndex(accountId).pipe(map(accountIndex => [accountId, accountIndex]));
    }

    const accountIndex = api.registry.createType('AccountIndex', decoded);
    return api.derive.accounts.indexToId(accountIndex.toString()).pipe(map(accountId => [accountId, accountIndex]));
  } catch (error) {
    return of([undefined, undefined]);
  }
}
/**
 * @name idAndIndex
 * @param {(Address | AccountId | AccountIndex | Uint8Array | string | null)} address - An accounts address in various formats.
 * @description  An array containing the [[AccountId]] and [[AccountIndex]] as optional values.
 * @example
 * <BR>
 *
 * ```javascript
 * api.derive.accounts.idAndIndex('F7Hs', ([id, ix]) => {
 *   console.log(`AccountId #${id} with corresponding AccountIndex ${ix}`);
 * });
 * ```
 */


export function idAndIndex(instanceId, api) {
  return memo(instanceId, address => retrieve(api, address));
}