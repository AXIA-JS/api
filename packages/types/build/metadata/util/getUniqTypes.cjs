"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUniqTypes = getUniqTypes;

var _flattenUniq = require("./flattenUniq.cjs");

var _validateTypes = require("./validateTypes.cjs");

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0

/** @internal */
function extractTypes(lookup, types) {
  return types.map(({
    type
  }) => lookup.getTypeDef(type).type);
}
/** @internal */


function extractFieldTypes(lookup, type) {
  return lookup.getSiType(type).def.asVariant.variants.map(({
    fields
  }) => extractTypes(lookup, fields));
}
/** @internal */


function getPalletNames({
  lookup,
  pallets
}) {
  return pallets.reduce((all, {
    calls,
    constants,
    events,
    storage
  }) => {
    all.push([extractTypes(lookup, constants)]);

    if (calls.isSome) {
      all.push(extractFieldTypes(lookup, calls.unwrap().type));
    }

    if (events.isSome) {
      all.push(extractFieldTypes(lookup, events.unwrap().type));
    }

    if (storage.isSome) {
      all.push(storage.unwrap().items.map(({
        type
      }) => {
        if (type.isPlain) {
          return [lookup.getTypeDef(type.asPlain).type];
        }

        const {
          hashers,
          key,
          value
        } = type.asMap;
        return hashers.length === 1 ? [lookup.getTypeDef(value).type, lookup.getTypeDef(key).type] : [lookup.getTypeDef(value).type, ...lookup.getSiType(key).def.asTuple.map(t => lookup.getTypeDef(t).type)];
      }));
    }

    return all;
  }, []);
}
/** @internal */


function getUniqTypes(registry, meta, throwError) {
  return (0, _validateTypes.validateTypes)(registry, throwError, (0, _flattenUniq.flattenUniq)(getPalletNames(meta)));
}