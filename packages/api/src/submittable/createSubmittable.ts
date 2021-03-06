// Copyright 2017-2021 @axia-js/api authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Call, Extrinsic } from '@axia-js/types/interfaces';
import type { ApiInterfaceRx, ApiTypes } from '../types';
import type { SubmittableExtrinsic } from './types';

import { ApiBase } from '../base';
import { createClass } from './createClass';

type Creator<ApiType extends ApiTypes> = (extrinsic: Call | Uint8Array | string) => SubmittableExtrinsic<ApiType>;

export function createSubmittable<ApiType extends ApiTypes> (apiType: ApiTypes, api: ApiInterfaceRx, decorateMethod: ApiBase<ApiType>['_decorateMethod']): Creator<ApiType> {
  const Submittable = createClass<ApiType>({ api, apiType, decorateMethod });

  return (extrinsic: Call | Extrinsic | Uint8Array | string): SubmittableExtrinsic<ApiType> =>
    new Submittable(api.registry, extrinsic);
}
