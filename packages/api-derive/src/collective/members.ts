// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Observable } from 'rxjs';
import type { ApiInterfaceRx } from '@axia-js/api/types';
import type { AccountId } from '@axia-js/types/interfaces';
import type { Collective } from './types';

import { of } from 'rxjs';

import { isFunction } from '@axia-js/util';

import { memo } from '../util';
import { getInstance } from './getInstance';

export function members (instanceId: string, api: ApiInterfaceRx, _section: Collective): () => Observable<AccountId[]> {
  const section = getInstance(api, _section);

  return memo(instanceId, (): Observable<AccountId[]> =>
    isFunction(api.query[section]?.members)
      ? api.query[section as 'council'].members()
      : of([])
  );
}
