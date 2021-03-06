// Copyright 2017-2021 @axia-js/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Observable } from 'rxjs';
import type { ApiInterfaceRx } from '@axia-js/api/types';
import type { Option, Vec } from '@axia-js/types';
import type { AccountId, Balance, Hash, PropIndex } from '@axia-js/types/interfaces';
import type { ITuple } from '@axia-js/types/types';
import type { DeriveProposal, DeriveProposalImage } from '../types';

import { combineLatest, map, of, switchMap } from 'rxjs';

import { isFunction } from '@axia-js/util';

import { memo } from '../util';

type DepositorsNew = Option<ITuple<[Vec<AccountId>, Balance]>>;
type DepositorsOld = Option<ITuple<[Balance, Vec<AccountId>]>>;
type Depositors = DepositorsNew | DepositorsOld;
type Proposals = ITuple<[PropIndex, Hash, AccountId]>[];
type Result = [Proposals, (DeriveProposalImage | undefined)[], Depositors[]];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isNewDepositors (depositors: ITuple<[Vec<AccountId>, Balance]> | ITuple<[Balance, Vec<AccountId>]>): depositors is ITuple<[Vec<AccountId>, Balance]> {
  // Detect balance...
  // eslint-disable-next-line @typescript-eslint/unbound-method
  return isFunction((depositors[1] as Balance).mul);
}

function parse ([proposals, images, optDepositors]: Result): DeriveProposal[] {
  return proposals
    .filter(([, , proposer], index): boolean =>
      !!(optDepositors[index]?.isSome) && !proposer.isEmpty
    )
    .map(([index, imageHash, proposer], proposalIndex): DeriveProposal => {
      const depositors = optDepositors[proposalIndex].unwrap();

      return {
        ...(
          isNewDepositors(depositors)
            ? { balance: depositors[1], seconds: depositors[0] }
            : { balance: depositors[0], seconds: depositors[1] }
        ),
        image: images[proposalIndex],
        imageHash,
        index,
        proposer
      };
    });
}

export function proposals (instanceId: string, api: ApiInterfaceRx): () => Observable<DeriveProposal[]> {
  return memo(instanceId, (): Observable<DeriveProposal[]> =>
    isFunction(api.query.democracy?.publicProps) && isFunction(api.query.democracy?.preimages)
      ? api.query.democracy.publicProps<Proposals>().pipe(
        switchMap((proposals) =>
          proposals.length
            ? combineLatest([
              of(proposals),
              api.derive.democracy.preimages(
                proposals.map(([, hash]): Hash => hash)),
              api.query.democracy.depositOf.multi<Depositors>(
                proposals.map(([index]): PropIndex => index))
            ])
            : of<Result>([[], [], []])
        ),
        map(parse)
      )
      : of([])
  );
}
