// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0

import metadataStatic from '@axia-js/types-support/metadata/static-substrate';
import { compactAddLength, u8aToU8a } from '@axia-js/util';

import { TypeRegistry } from '../../../create';
import { Metadata } from '../../Metadata';
import { getStorage } from './getStorage';

const registry = new TypeRegistry();
const metadata = new Metadata(registry, metadataStatic);

registry.setMetadata(metadata);

describe('getSorage', (): void => {
  const storage = getStorage(registry);

  it('should return well known keys', (): void => {
    expect(typeof storage.substrate).toBe('object');

    expect(storage.substrate.code()).toEqual(compactAddLength(u8aToU8a(':code')));

    expect(storage.substrate.changesTrieConfig).toBeTruthy();
    expect(storage.substrate.childStorageKeyPrefix).toBeTruthy();
    expect(storage.substrate.extrinsicIndex).toBeTruthy();
    expect(storage.substrate.heapPages).toBeTruthy();
  });
});
