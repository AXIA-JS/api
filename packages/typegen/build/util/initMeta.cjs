"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initMeta = initMeta;

var _types = require("@axia-js/types");

var _staticSubstrate = _interopRequireDefault(require("@axia-js/types-support/metadata/static-substrate"));

var _register = require("./register.cjs");

// Copyright 2017-2021 @axia-js/typegen authors & contributors
// SPDX-License-Identifier: Apache-2.0
function initMeta(staticMeta = _staticSubstrate.default, extraTypes = {}) {
  const registry = new _types.TypeRegistry();
  (0, _register.registerDefinitions)(registry, extraTypes);
  const metadata = new _types.Metadata(registry, staticMeta);
  registry.setMetadata(metadata);
  return {
    metadata,
    registry
  };
}