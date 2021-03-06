"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractStorageArgs = extractStorageArgs;

var _util = require("@axia-js/util");

// Copyright 2017-2019 @axia-js/api authors & contributors
// SPDX-License-Identifier: Apache-2.0
function sig(_ref, _ref2, args) {
  let {
    lookup
  } = _ref;
  let {
    method,
    section
  } = _ref2;
  return `${section}.${method}(${args.map(a => lookup.getTypeDef(a).type).join(', ')})`;
} // sets up the arguments in the form of [creator, args] ready to be used in a storage
// call. Additionally, it verifies that the correct number of arguments have been passed


function extractStorageArgs(registry, creator, _args) {
  const args = _args.filter(arg => !(0, _util.isUndefined)(arg));

  if (creator.meta.type.isPlain) {
    (0, _util.assert)(args.length === 0, () => `${sig(registry, creator, [])} does not take any arguments, ${args.length} found`);
  } else {
    const {
      hashers,
      key
    } = creator.meta.type.asMap;
    const keys = hashers.length === 1 ? [key] : registry.lookup.getSiType(key).def.asTuple.map(t => t);
    (0, _util.assert)(args.length === keys.length, () => `${sig(registry, creator, keys)} is a map, requiring ${keys.length} arguments, ${args.length} found`);
  } // pass as tuple


  return [creator, args];
}