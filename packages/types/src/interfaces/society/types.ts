// Auto-generated via `yarn axia-types-from-defs`, do not edit
/* eslint-disable */

import type { Enum, Struct, u32 } from '@axia-js/types';
import type { AccountId, Balance } from '@axia-js/types/interfaces/runtime';
import type { ITuple } from '@axia-js/types/types';

/** @name Bid */
export interface Bid extends Struct {
  readonly who: AccountId;
  readonly kind: BidKind;
  readonly value: Balance;
}

/** @name BidKind */
export interface BidKind extends Enum {
  readonly isDeposit: boolean;
  readonly asDeposit: Balance;
  readonly isVouch: boolean;
  readonly asVouch: ITuple<[AccountId, Balance]>;
}

/** @name SocietyJudgement */
export interface SocietyJudgement extends Enum {
  readonly isRebid: boolean;
  readonly isReject: boolean;
  readonly isApprove: boolean;
}

/** @name SocietyVote */
export interface SocietyVote extends Enum {
  readonly isSkeptic: boolean;
  readonly isReject: boolean;
  readonly isApprove: boolean;
}

/** @name StrikeCount */
export interface StrikeCount extends u32 {}

/** @name VouchingStatus */
export interface VouchingStatus extends Enum {
  readonly isVouching: boolean;
  readonly isBanned: boolean;
}

export type PHANTOM_SOCIETY = 'society';
