// Copyright 2017-2021 @axia-js/api authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { createClass } from "./createClass.js";
export function createSubmittable(apiType, api, decorateMethod) {
  const Submittable = createClass({
    api,
    apiType,
    decorateMethod
  });
  return extrinsic => new Submittable(api.registry, extrinsic);
}