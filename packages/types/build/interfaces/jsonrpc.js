import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import * as definitions from "./definitions.js";
const jsonrpc = {};
Object.keys(definitions).filter(key => Object.keys(definitions[key].rpc || {}).length !== 0).forEach(_section => {
  jsonrpc[_section] = {};
  Object.entries(definitions[_section].rpc).forEach(([method, def]) => {
    const isSubscription = !!def.pubsub;
    const section = def.aliasSection || _section; // allow for section overrides

    if (!jsonrpc[section]) {
      jsonrpc[section] = {};
    }

    jsonrpc[section][method] = _objectSpread(_objectSpread({}, def), {}, {
      isSubscription,
      jsonrpc: `${section}_${method}`,
      method,
      section
    });
  });
});
export default jsonrpc;