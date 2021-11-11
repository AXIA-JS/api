// Copyright 2017-2021 @axia-js/typegen authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { Metadata, TypeRegistry } from '@axia-js/types';
import staticSubstrate from '@axia-js/types-support/metadata/static-substrate';
import { registerDefinitions } from "./register.js";
export function initMeta(staticMeta = staticSubstrate, extraTypes = {}) {
  const registry = new TypeRegistry();
  registerDefinitions(registry, extraTypes);
  const metadata = new Metadata(registry, staticMeta);
  registry.setMetadata(metadata);
  return {
    metadata,
    registry
  };
}