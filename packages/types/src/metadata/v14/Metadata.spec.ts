// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0

import axialunarData from '@axia-js/types-support/metadata/v14/axialunar-hex';
import axialunarJson from '@axia-js/types-support/metadata/v14/axialunar-json.json';
import axialunarTypes from '@axia-js/types-support/metadata/v14/axialunar-types.json';
import axiaData from '@axia-js/types-support/metadata/v14/axia-hex';
import axiaJson from '@axia-js/types-support/metadata/v14/axia-json.json';
import axiaTypes from '@axia-js/types-support/metadata/v14/axia-types.json';
import substrateData from '@axia-js/types-support/metadata/v14/substrate-hex';
import substrateJson from '@axia-js/types-support/metadata/v14/substrate-json.json';
import substrateTypes from '@axia-js/types-support/metadata/v14/substrate-types.json';

import { testMeta } from '../util/testUtil';

testMeta(14, {
  axialunar: {
    compare: axialunarJson as Record<string, unknown>,
    data: axialunarData,
    types: axialunarTypes as Record<string, unknown>
  },
  axia: {
    compare: axiaJson as Record<string, unknown>,
    data: axiaData,
    types: axiaTypes as Record<string, unknown>
  },
  substrate: {
    compare: substrateJson as Record<string, unknown>,
    data: substrateData,
    types: substrateTypes as Record<string, unknown>
  }
});
