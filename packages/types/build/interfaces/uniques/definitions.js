// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
// order important in structs... :)

/* eslint-disable sort-keys */
export default {
  rpc: {},
  types: {
    ClassId: 'u32',
    InstanceId: 'u32',
    DepositBalance: 'Balance',
    DepositBalanceOf: 'Balance',
    ClassDetails: {
      owner: 'AccountId',
      issuer: 'AccountId',
      admin: 'AccountId',
      freezer: 'AccountId',
      totalDeposit: 'DepositBalance',
      freeHolding: 'bool',
      instances: 'u32',
      instanceMetadatas: 'u32',
      attributes: 'u32',
      isFrozen: 'bool'
    },
    DestroyWitness: {
      instances: 'Compact<u32>',
      instanceMetadatas: 'Compact<u32>',
      attributes: 'Compact<u32>'
    },
    InstanceDetails: {
      owner: 'AccountId',
      approved: 'Option<AccountId>',
      isFrozen: 'bool',
      deposit: 'DepositBalance'
    },
    ClassMetadata: {
      deposit: 'DepositBalance',
      data: 'Vec<u8>',
      isFrozen: 'bool'
    },
    InstanceMetadata: {
      deposit: 'DepositBalance',
      data: 'Vec<u8>',
      isFrozen: 'bool'
    }
  }
};