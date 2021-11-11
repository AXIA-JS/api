// Copyright 2017-2021 @axia-js/rpc-provider authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Logger } from '@axia-js/util/types';
import type { RpcCoder } from '../coder';

export interface HttpState {
  coder: RpcCoder;
  endpoint: string;
  l: Logger;
}
