"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateDefaultErrors = generateDefaultErrors;

var _handlebars = _interopRequireDefault(require("handlebars"));

var _util = require("@axia-js/util");

var _index = require("../util/index.cjs");

// Copyright 2017-2021 @axia-js/typegen authors & contributors
// SPDX-License-Identifier: Apache-2.0
const template = (0, _index.readTemplate)('errors');

const generateForMetaTemplate = _handlebars.default.compile(template);
/** @internal */


function generateForMeta(meta, dest, isStrict) {
  (0, _index.writeFile)(dest, () => {
    const imports = (0, _index.createImports)({});
    const {
      lookup,
      pallets
    } = meta.asLatest;
    const modules = pallets.filter(({
      errors
    }) => errors.isSome).map(({
      errors,
      name
    }) => ({
      items: lookup.getSiType(errors.unwrap().type).def.asVariant.variants.map(({
        docs,
        name
      }) => ({
        docs,
        name: name.toString()
      })).sort(_index.compareName),
      name: (0, _util.stringCamelCase)(name)
    })).sort(_index.compareName);
    return generateForMetaTemplate({
      headerType: 'chain',
      imports,
      isStrict,
      modules,
      types: [{
        file: '@axia-js/api/types',
        types: ['ApiTypes']
      }]
    });
  });
} // Call `generateForMeta()` with current static metadata

/** @internal */


function generateDefaultErrors(dest = 'packages/api/src/augment/errors.ts', data, extraTypes = {}, isStrict = false) {
  const {
    metadata
  } = (0, _index.initMeta)(data, extraTypes);
  return generateForMeta(metadata, dest, isStrict);
}