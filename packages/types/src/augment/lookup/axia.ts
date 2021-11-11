// Auto-generated via `yarn axia-types-from-defs`, do not edit
/* eslint-disable */

/* eslint-disable sort-keys */

import type { DefinitionsTypes } from '../../types';

export default {
  /**
   * Lookup66: axia_runtime_common::claims::EthereumAddress
   **/
  AXIARuntimeCommonClaimsEthereumAddress: '[u8;20]',
  /**
   * Lookup72: axia_runtime::ProxyType
   **/
  AXIARuntimeProxyType: {
    _enum: ['Any', 'NonTransfer', 'Governance', 'Staking', 'Unused4', 'IdentityJudgement', 'CancelProxy']
  },
  /**
   * Lookup139: axia_runtime::SessionKeys
   **/
  AXIARuntimeSessionKeys: {
    grandpa: 'SpFinalityGrandpaAppPublic',
    babe: 'SpConsensusBabeAppPublic',
    imOnline: 'PalletImOnlineSr25519AppSr25519Public',
    paraValidator: 'AXIAPrimitivesV0ValidatorAppPublic',
    paraAssignment: 'AXIAPrimitivesV1AssignmentAppPublic',
    authorityDiscovery: 'SpAuthorityDiscoveryAppPublic'
  },
  /**
   * Lookup140: axia_primitives::v0::validator_app::Public
   **/
  AXIAPrimitivesV0ValidatorAppPublic: 'SpCoreSr25519Public',
  /**
   * Lookup141: axia_primitives::v1::assignment_app::Public
   **/
  AXIAPrimitivesV1AssignmentAppPublic: 'SpCoreSr25519Public',
  /**
   * Lookup175: axia_runtime_common::claims::EcdsaSignature
   **/
  AXIARuntimeCommonClaimsEcdsaSignature: '[u8;65]',
  /**
   * Lookup180: axia_runtime_common::claims::StatementKind
   **/
  AXIARuntimeCommonClaimsStatementKind: {
    _enum: ['Regular', 'Saft']
  },
  /**
   * Lookup233: axia_runtime::NposCompactSolution16
   **/
  AXIARuntimeNposCompactSolution16: {
    votes1: 'Vec<(Compact<u32>,Compact<u16>)>',
    votes2: 'Vec<(Compact<u32>,(Compact<u16>,Compact<PerU16>),Compact<u16>)>',
    votes3: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);2],Compact<u16>)>',
    votes4: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);3],Compact<u16>)>',
    votes5: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);4],Compact<u16>)>',
    votes6: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);5],Compact<u16>)>',
    votes7: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);6],Compact<u16>)>',
    votes8: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);7],Compact<u16>)>',
    votes9: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);8],Compact<u16>)>',
    votes10: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);9],Compact<u16>)>',
    votes11: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);10],Compact<u16>)>',
    votes12: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);11],Compact<u16>)>',
    votes13: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);12],Compact<u16>)>',
    votes14: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);13],Compact<u16>)>',
    votes15: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);14],Compact<u16>)>',
    votes16: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);15],Compact<u16>)>'
  },
  /**
   * Lookup290: axia_runtime::OriginCaller
   **/
  AXIARuntimeOriginCaller: {
    _enum: {
      system: 'FrameSystemRawOrigin',
      Unused1: 'Null',
      Unused2: 'Null',
      Void: 'SpCoreVoid',
      Unused4: 'Null',
      Unused5: 'Null',
      Unused6: 'Null',
      Unused7: 'Null',
      Unused8: 'Null',
      Unused9: 'Null',
      Unused10: 'Null',
      Unused11: 'Null',
      Unused12: 'Null',
      Unused13: 'Null',
      Unused14: 'Null',
      Council: 'PalletCollectiveRawOrigin',
      TechnicalCommittee: 'PalletCollectiveRawOrigin'
    }
  },
  /**
   * Lookup441: axia_runtime_common::claims::PrevalidateAttests<T>
   **/
  AXIARuntimeCommonClaimsPrevalidateAttests: 'Null',
  /**
   * Lookup442: axia_runtime::Runtime
   **/
  AXIARuntimeRuntime: 'Null'
} as DefinitionsTypes;
