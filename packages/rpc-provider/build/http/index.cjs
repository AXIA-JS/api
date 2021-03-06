"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HttpProvider = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classPrivateFieldLooseBase2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseBase"));

var _classPrivateFieldLooseKey2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseKey"));

var _util = require("@axia-js/util");

var _xFetch = require("@axia-js/x-fetch");

var _index = require("../coder/index.cjs");

var _defaults = _interopRequireDefault(require("../defaults.cjs"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const ERROR_SUBSCRIBE = 'HTTP Provider does not have subscriptions, use WebSockets instead';
const l = (0, _util.logger)('api-http');
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

var _coder = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("coder");

var _endpoint = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("endpoint");

var _headers = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("headers");

class HttpProvider {
  /**
   * @param {string} endpoint The endpoint url starting with http://
   */
  constructor() {
    let endpoint = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _defaults.default.HTTP_URL;
    let headers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
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
    (0, _util.assert)(/^(https|http):\/\//.test(endpoint), () => `Endpoint should start with 'http://', received '${endpoint}'`);
    (0, _classPrivateFieldLooseBase2.default)(this, _coder)[_coder] = new _index.RpcCoder();
    (0, _classPrivateFieldLooseBase2.default)(this, _endpoint)[_endpoint] = endpoint;
    (0, _classPrivateFieldLooseBase2.default)(this, _headers)[_headers] = headers;
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
    return new HttpProvider((0, _classPrivateFieldLooseBase2.default)(this, _endpoint)[_endpoint], (0, _classPrivateFieldLooseBase2.default)(this, _headers)[_headers]);
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
    const body = (0, _classPrivateFieldLooseBase2.default)(this, _coder)[_coder].encodeJson(method, params);

    const response = await (0, _xFetch.fetch)((0, _classPrivateFieldLooseBase2.default)(this, _endpoint)[_endpoint], {
      body,
      headers: _objectSpread({
        Accept: 'application/json',
        'Content-Length': `${body.length}`,
        'Content-Type': 'application/json'
      }, (0, _classPrivateFieldLooseBase2.default)(this, _headers)[_headers]),
      method: 'POST'
    });
    (0, _util.assert)(response.ok, () => `[${response.status}]: ${response.statusText}`); // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment

    const result = await response.json();
    return (0, _classPrivateFieldLooseBase2.default)(this, _coder)[_coder].decodeResponse(result);
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

exports.HttpProvider = HttpProvider;