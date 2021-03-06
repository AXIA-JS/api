// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { stringCamelCase } from '@axia-js/util';
import { variantToMeta } from "../errors/index.js";
/** @internal */

export function decorateEvents(registry, {
  lookup,
  pallets
}, metaVersion) {
  return pallets.filter(({
    events
  }) => events.isSome).reduce((result, {
    events,
    index,
    name
  }, _sectionIndex) => {
    const sectionIndex = metaVersion >= 12 ? index.toNumber() : _sectionIndex;
    result[stringCamelCase(name)] = lookup.getSiType(events.unwrap().type).def.asVariant.variants.reduce((newModule, variant) => {
      // we don't camelCase the event name
      newModule[variant.name.toString()] = {
        is: eventRecord => eventRecord.index[0] === sectionIndex && variant.index.eq(eventRecord.index[1]),
        meta: registry.createType('EventMetadataLatest', variantToMeta(lookup, variant))
      };
      return newModule;
    }, {});
    return result;
  }, {});
}