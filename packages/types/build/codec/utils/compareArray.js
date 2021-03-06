// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { isUndefined } from '@axia-js/util';
import { hasEq } from "./util.js"; // NOTE These are used internally and when comparing objects, expects that
// when the second is an Codec[] that the first has to be as well

export function compareArray(a, b) {
  if (Array.isArray(b)) {
    return a.length === b.length && isUndefined(a.find((value, index) => hasEq(value) ? !value.eq(b[index]) : value !== b[index]));
  }

  return false;
}