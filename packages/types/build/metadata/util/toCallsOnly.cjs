"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toCallsOnly = toCallsOnly;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
function trimDocs(docs) {
  const strings = docs.map(d => d.toString().trim());
  const firstEmpty = strings.findIndex(d => !d.length);
  return firstEmpty === -1 ? strings : strings.slice(0, firstEmpty);
}
/** @internal */


function toCallsOnly(registry, _ref) {
  let {
    extrinsic,
    lookup,
    pallets
  } = _ref;
  return registry.createType('MetadataLatest', {
    extrinsic,
    lookup: {
      types: lookup.types.map(_ref2 => {
        let {
          id,
          type
        } = _ref2;
        return registry.createType('PortableType', {
          id,
          type: _objectSpread(_objectSpread({}, type), {}, {
            docs: trimDocs(type.docs)
          })
        });
      })
    },
    pallets: pallets.map(_ref3 => {
      let {
        calls,
        index,
        name
      } = _ref3;
      return {
        calls: registry.createType('Option<PalletCallMetadataLatest>', calls.unwrapOr(null)),
        index,
        name
      };
    })
  }).toJSON();
}