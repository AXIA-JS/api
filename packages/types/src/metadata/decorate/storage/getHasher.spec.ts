// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { stringToU8a } from '@axia-js/util';
import { xxhashAsU8a } from '@axia-js/util-crypto';

import { TypeRegistry } from '../../../create';
import { getHasher } from './getHasher';

describe('getHasher', (): void => {
  const registry = new TypeRegistry();

  describe('Twox64Concat', (): void => {
    it('matches the foo test from Rust', (): void => {
      const hasher = getHasher(registry.createType('StorageHasher', 'Twox64Concat'));
      const hash = hasher('foo');
      const xxhash = xxhashAsU8a('foo', 128);

      expect([
        hash.subarray(0, 8),
        hash.subarray(8)
      ]).toEqual([
        xxhash.subarray(0, 8),
        stringToU8a('foo')
      ]);
    });
  });
});
