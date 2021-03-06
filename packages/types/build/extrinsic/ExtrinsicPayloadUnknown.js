// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { Struct } from "../codec/Struct.js";
/**
 * @name GenericExtrinsicPayloadUnknown
 * @description
 * A default handler for payloads where the version is not known (default throw)
 */

export class GenericExtrinsicPayloadUnknown extends Struct {
  constructor(registry, value, {
    version = 0
  } = {}) {
    super(registry, {});
    throw new Error(`Unsupported extrinsic payload version ${version}`);
  }

}