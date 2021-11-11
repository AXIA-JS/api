// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0

import substrateData from '@axia-js/types-support/metadata/v12/substrate-hex';
import substrateJson from '@axia-js/types-support/metadata/v12/substrate-json.json';

import { testMeta } from '../util/testUtil';

testMeta(12, {
  substrate: {
    compare: substrateJson as Record<string, unknown>,
    data: substrateData
  }
});
