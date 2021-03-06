// Copyright 2017-2021 @axia-js/api authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Definitions } from '../../types';

import axialunar from './axialunar';
import axia from './axia';
import substrate from './substrate';

export default {
  rpc: {},
  types: {
    // Not 100% sure it is relevant, however the order here is the same
    // as exposed in the typegen lookup order
    ...substrate,
    ...axia,
    ...axialunar
  }
} as Definitions;
