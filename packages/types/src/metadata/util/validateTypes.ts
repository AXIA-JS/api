// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Registry } from '../../types';

import { logger } from '@axia-js/util';

import { extractTypes } from './extractTypes';
import { flattenUniq } from './flattenUniq';

const l = logger('metadata');

/** @internal */
export function validateTypes (registry: Registry, throwError: boolean, types: string[]): string[] {
  const missing = flattenUniq(extractTypes(types))
    .filter((type) => !registry.hasType(type))
    .sort();

  if (missing.length !== 0) {
    const message = `Unknown types found, no types for ${missing.join(', ')}`;

    if (throwError) {
      throw new Error(message);
    } else {
      l.warn(message);
    }
  }

  return types;
}
