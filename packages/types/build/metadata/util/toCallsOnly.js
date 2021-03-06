import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
function trimDocs(docs) {
  const strings = docs.map(d => d.toString().trim());
  const firstEmpty = strings.findIndex(d => !d.length);
  return firstEmpty === -1 ? strings : strings.slice(0, firstEmpty);
}
/** @internal */


export function toCallsOnly(registry, {
  extrinsic,
  lookup,
  pallets
}) {
  return registry.createType('MetadataLatest', {
    extrinsic,
    lookup: {
      types: lookup.types.map(({
        id,
        type
      }) => registry.createType('PortableType', {
        id,
        type: _objectSpread(_objectSpread({}, type), {}, {
          docs: trimDocs(type.docs)
        })
      }))
    },
    pallets: pallets.map(({
      calls,
      index,
      name
    }) => ({
      calls: registry.createType('Option<PalletCallMetadataLatest>', calls.unwrapOr(null)),
      index,
      name
    }))
  }).toJSON();
}