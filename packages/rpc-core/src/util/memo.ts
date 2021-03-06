// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Observer, TeardownLogic } from 'rxjs';
import type { Memoized } from '@axia-js/util/types';

import { Observable } from 'rxjs';

import { memoize } from '@axia-js/util';

import { drr } from './drr';

type ObsFn <T> = (...params: any[]) => Observable<T>;

// Wraps a derive, doing 2 things to optimize calls -
//   1. creates a memo of the inner fn -> Observable, removing when unsubscribed
//   2. wraps the observable in a drr() (which includes an unsub delay)
/** @internal */
export function memo <T> (instanceId: string, inner: ObsFn<T>): Memoized<ObsFn<T>> {
  const options = { getInstanceId: () => instanceId };
  const cached = memoize(
    (...params: any[]): Observable<T> =>
      new Observable((observer: Observer<T>): TeardownLogic => {
        const subscription = inner(...params).subscribe(observer);

        return (): void => {
          cached.unmemoize(...params);
          subscription.unsubscribe();
        };
      }).pipe(drr()),
    options
  );

  return cached;
}
