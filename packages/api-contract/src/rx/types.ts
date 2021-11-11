// Copyright 2017-2021 @axia-js/api-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { BlueprintSubmittableResult as BaseBlueprintSubmittableResult, CodeSubmittableResult as BaseCodeSubmittableResult } from '../base';

export type BlueprintSubmittableResult = BaseBlueprintSubmittableResult<'promise'>;
export type CodeSubmittableResult = BaseCodeSubmittableResult<'promise'>;
