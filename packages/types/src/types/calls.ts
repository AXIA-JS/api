// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Call } from '../interfaces/runtime';
import type { AnyTuple } from './codec';
import type { IMethod } from './interfaces';

export interface CallBase<A extends AnyTuple> extends IMethod<A> {
  readonly method: string;
  readonly section: string;

  toJSON: () => any;
}

export interface CallFunction<A extends AnyTuple = AnyTuple> extends CallBase<A> {
  (...args: any[]): Call & IMethod<A>;
}
