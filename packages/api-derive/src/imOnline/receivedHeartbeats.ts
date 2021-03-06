// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Observable } from 'rxjs';
import type { ApiInterfaceRx } from '@axia-js/api/types';
import type { Bytes, Option, u32 } from '@axia-js/types';
import type { AccountId } from '@axia-js/types/interfaces';
import type { DeriveHeartbeats } from '../types';

import { combineLatest, map, of, switchMap } from 'rxjs';

import { BN_ZERO } from '@axia-js/util';

import { memo } from '../util';

function mapResult ([result, validators, heartbeats, numBlocks]: [DeriveHeartbeats, AccountId[], Option<Bytes>[], u32[]]): DeriveHeartbeats {
  validators.forEach((validator, index): void => {
    const validatorId = validator.toString();
    const blockCount = numBlocks[index];
    const hasMessage = !heartbeats[index].isEmpty;
    const prev = result[validatorId];

    if (!prev || prev.hasMessage !== hasMessage || !prev.blockCount.eq(blockCount)) {
      result[validatorId] = {
        blockCount,
        hasMessage,
        isOnline: hasMessage || blockCount.gt(BN_ZERO)
      };
    }
  });

  return result;
}

/**
 * @description Return a boolean array indicating whether the passed accounts had received heartbeats in the current session
 */
export function receivedHeartbeats (instanceId: string, api: ApiInterfaceRx): () => Observable<DeriveHeartbeats> {
  return memo(instanceId, (): Observable<DeriveHeartbeats> =>
    api.query.imOnline?.receivedHeartbeats
      ? api.derive.staking.overview().pipe(
        switchMap(({ currentIndex, validators }): Observable<[DeriveHeartbeats, AccountId[], Option<Bytes>[], u32[]]> =>
          combineLatest([
            of({}),
            of(validators),
            api.query.imOnline.receivedHeartbeats.multi<Option<Bytes>>(
              validators.map((_address, index) => [currentIndex, index])),
            api.query.imOnline.authoredBlocks.multi<u32>(
              validators.map((address) => [currentIndex, address]))
          ])
        ),
        map(mapResult)
      )
      : of({})
  );
}
