import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import _classPrivateFieldLooseBase from "@babel/runtime/helpers/esm/classPrivateFieldLooseBase";
import _classPrivateFieldLooseKey from "@babel/runtime/helpers/esm/classPrivateFieldLooseKey";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Copyright 2017-2021 @axia-js/rpc-provider authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { assert, logger } from '@axia-js/util';
import { fetch } from '@axia-js/x-fetch';
import { RpcCoder } from "../coder/index.js";
import defaults from "../defaults.js";
const ERROR_SUBSCRIBE = 'HTTP Provider does not have subscriptions, use WebSockets instead';
const l = logger('api-http');
/**
 * # @axia-js/rpc-provider
 *
 * @name HttpProvider
 *
 * @description The HTTP Provider allows sending requests using HTTP to a HTTP RPC server TCP port. It does not support subscriptions so you won't be able to listen to events such as new blocks or balance changes. It is usually preferable using the [[WsProvider]].
 *
 * @example
 * <BR>
 *
 * ```javascript
 * import Api from '@axia-js/api/promise';
 * import { HttpProvider } from '@axia-js/rpc-provider';
 *
 * const provider = new HttpProvider('http://127.0.0.1:9933');
 * const api = new Api(provider);
 * ```
 *
 * @see [[WsProvider]]
 */

var _coder = /*#__PURE__*/_classPrivateFieldLooseKey("coder");

var _endpoint = /*#__PURE__*/_classPrivateFieldLooseKey("endpoint");

var _headers = /*#__PURE__*/_classPrivateFieldLooseKey("headers");

export class HttpProvider {
  /**
   * @param {string} endpoint The endpoint url starting with http://
   */
  constructor(endpoint = defaults.HTTP_URL, headers = {}) {
    Object.defineProperty(this, _coder, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _endpoint, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _headers, {
      writable: true,
      value: void 0
    });
    assert(/^(https|http):\/\//.test(endpoint), () => `Endpoint should start with 'http://', received '${endpoint}'`);
    _classPrivateFieldLooseBase(this, _coder)[_coder] = new RpcCoder();
    _classPrivateFieldLooseBase(this, _endpoint)[_endpoint] = endpoint;
    _classPrivateFieldLooseBase(this, _headers)[_headers] = headers;
  }
  /**
   * @summary `true` when this provider supports subscriptions
   */


  get hasSubscriptions() {
    return false;
  }
  /**
   * @description Returns a clone of the object
   */


  clone() {
    return new HttpProvider(_classPrivateFieldLooseBase(this, _endpoint)[_endpoint], _classPrivateFieldLooseBase(this, _headers)[_headers]);
  }
  /**
   * @description Manually connect from the connection
   */


  async connect() {// noop
  }
  /**
   * @description Manually disconnect from the connection
   */


  async disconnect() {// noop
  }
  /**
   * @summary Whether the node is connected or not.
   * @return {boolean} true if connected
   */


  get isConnected() {
    return true;
  }
  /**
   * @summary Events are not supported with the HttpProvider, see [[WsProvider]].
   * @description HTTP Provider does not have 'on' emitters. WebSockets should be used instead.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars


  on(type, sub) {
    l.error('HTTP Provider does not have \'on\' emitters, use WebSockets instead');
    return () => {// noop
    };
  }
  /**
   * @summary Send HTTP POST Request with Body to configured HTTP Endpoint.
   */


  async send(method, params) {
    const body = _classPrivateFieldLooseBase(this, _coder)[_coder].encodeJson(method, params);

    const response = await fetch(_classPrivateFieldLooseBase(this, _endpoint)[_endpoint], {
      body,
      headers: _objectSpread({
        Accept: 'application/json',
        'Content-Length': `${body.length}`,
        'Content-Type': 'application/json'
      }, _classPrivateFieldLooseBase(this, _headers)[_headers]),
      method: 'POST'
    });
    assert(response.ok, () => `[${response.status}]: ${response.statusText}`); // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment

    const result = await response.json();
    return _classPrivateFieldLooseBase(this, _coder)[_coder].decodeResponse(result);
  }
  /**
   * @summary Subscriptions are not supported with the HttpProvider, see [[WsProvider]].
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await


  async subscribe(types, method, params, cb) {
    l.error(ERROR_SUBSCRIBE);
    throw new Error(ERROR_SUBSCRIBE);
  }
  /**
   * @summary Subscriptions are not supported with the HttpProvider, see [[WsProvider]].
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await


  async unsubscribe(type, method, id) {
    l.error(ERROR_SUBSCRIBE);
    throw new Error(ERROR_SUBSCRIBE);
  }

}