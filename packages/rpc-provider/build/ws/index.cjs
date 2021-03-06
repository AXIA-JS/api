"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WsProvider = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classPrivateFieldLooseBase2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseBase"));

var _classPrivateFieldLooseKey2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseKey"));

var _eventemitter2 = _interopRequireDefault(require("eventemitter3"));

var _util = require("@axia-js/util");

var _xGlobal = require("@axia-js/x-global");

var _xWs = require("@axia-js/x-ws");

var _index = require("../coder/index.cjs");

var _defaults = _interopRequireDefault(require("../defaults.cjs"));

var _errors = require("./errors.cjs");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const ALIASES = {
  chain_finalisedHead: 'chain_finalizedHead',
  chain_subscribeFinalisedHeads: 'chain_subscribeFinalizedHeads',
  chain_unsubscribeFinalisedHeads: 'chain_unsubscribeFinalizedHeads'
};
const RETRY_DELAY = 2500;
const l = (0, _util.logger)('api-ws');

function eraseRecord(record, cb) {
  Object.keys(record).forEach(key => {
    if (cb) {
      cb(record[key]);
    }

    delete record[key];
  });
}
/**
 * # @axia-js/rpc-provider/ws
 *
 * @name WsProvider
 *
 * @description The WebSocket Provider allows sending requests using WebSocket to a WebSocket RPC server TCP port. Unlike the [[HttpProvider]], it does support subscriptions and allows listening to events such as new blocks or balance changes.
 *
 * @example
 * <BR>
 *
 * ```javascript
 * import Api from '@axia-js/api/promise';
 * import { WsProvider } from '@axia-js/rpc-provider/ws';
 *
 * const provider = new WsProvider('ws://127.0.0.1:9944');
 * const api = new Api(provider);
 * ```
 *
 * @see [[HttpProvider]]
 */


var _coder = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("coder");

var _endpoints = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("endpoints");

var _headers = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("headers");

var _eventemitter = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("eventemitter");

var _handlers = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("handlers");

var _isReadyPromise = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("isReadyPromise");

var _waitingForId = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("waitingForId");

var _autoConnectMs = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("autoConnectMs");

var _endpointIndex = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("endpointIndex");

var _isConnected = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("isConnected");

var _subscriptions = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("subscriptions");

var _websocket = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("websocket");

var _emit = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("emit");

var _onSocketClose = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("onSocketClose");

var _onSocketError = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("onSocketError");

var _onSocketMessage = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("onSocketMessage");

var _onSocketMessageResult = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("onSocketMessageResult");

var _onSocketMessageSubscribe = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("onSocketMessageSubscribe");

var _onSocketOpen = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("onSocketOpen");

var _resubscribe = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("resubscribe");

class WsProvider {
  /**
   * @param {string | string[]}  endpoint    The endpoint url. Usually `ws://ip:9944` or `wss://ip:9944`, may provide an array of endpoint strings.
   * @param {boolean} autoConnect Whether to connect automatically or not.
   */
  constructor() {
    var _this = this;

    let endpoint = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _defaults.default.WS_URL;
    let autoConnectMs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : RETRY_DELAY;
    let headers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    Object.defineProperty(this, _coder, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _endpoints, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _headers, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _eventemitter, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _handlers, {
      writable: true,
      value: {}
    });
    Object.defineProperty(this, _isReadyPromise, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _waitingForId, {
      writable: true,
      value: {}
    });
    Object.defineProperty(this, _autoConnectMs, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _endpointIndex, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _isConnected, {
      writable: true,
      value: false
    });
    Object.defineProperty(this, _subscriptions, {
      writable: true,
      value: {}
    });
    Object.defineProperty(this, _websocket, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _emit, {
      writable: true,
      value: function (type) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        (0, _classPrivateFieldLooseBase2.default)(_this, _eventemitter)[_eventemitter].emit(type, ...args);
      }
    });
    Object.defineProperty(this, _onSocketClose, {
      writable: true,
      value: event => {
        const error = new Error(`disconnected from ${(0, _classPrivateFieldLooseBase2.default)(this, _endpoints)[_endpoints][(0, _classPrivateFieldLooseBase2.default)(this, _endpointIndex)[_endpointIndex]]}: ${event.code}:: ${event.reason || (0, _errors.getWSErrorString)(event.code)}`);

        if ((0, _classPrivateFieldLooseBase2.default)(this, _autoConnectMs)[_autoConnectMs] > 0) {
          l.error(error.message);
        }

        (0, _classPrivateFieldLooseBase2.default)(this, _isConnected)[_isConnected] = false;

        if ((0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket]) {
          (0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket].onclose = null;
          (0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket].onerror = null;
          (0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket].onmessage = null;
          (0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket].onopen = null;
          (0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket] = null;
        }

        (0, _classPrivateFieldLooseBase2.default)(this, _emit)[_emit]('disconnected'); // reject all hanging requests


        eraseRecord((0, _classPrivateFieldLooseBase2.default)(this, _handlers)[_handlers], h => h.callback(error, undefined));
        eraseRecord((0, _classPrivateFieldLooseBase2.default)(this, _waitingForId)[_waitingForId]);

        if ((0, _classPrivateFieldLooseBase2.default)(this, _autoConnectMs)[_autoConnectMs] > 0) {
          setTimeout(() => {
            this.connectWithRetry().catch(() => {// does not throw
            });
          }, (0, _classPrivateFieldLooseBase2.default)(this, _autoConnectMs)[_autoConnectMs]);
        }
      }
    });
    Object.defineProperty(this, _onSocketError, {
      writable: true,
      value: error => {
        l.debug(() => ['socket error', error]);

        (0, _classPrivateFieldLooseBase2.default)(this, _emit)[_emit]('error', error);
      }
    });
    Object.defineProperty(this, _onSocketMessage, {
      writable: true,
      value: message => {
        l.debug(() => ['received', message.data]);
        const response = JSON.parse(message.data);
        return (0, _util.isUndefined)(response.method) ? (0, _classPrivateFieldLooseBase2.default)(this, _onSocketMessageResult)[_onSocketMessageResult](response) : (0, _classPrivateFieldLooseBase2.default)(this, _onSocketMessageSubscribe)[_onSocketMessageSubscribe](response);
      }
    });
    Object.defineProperty(this, _onSocketMessageResult, {
      writable: true,
      value: response => {
        const handler = (0, _classPrivateFieldLooseBase2.default)(this, _handlers)[_handlers][response.id];

        if (!handler) {
          l.debug(() => `Unable to find handler for id=${response.id}`);
          return;
        }

        try {
          const {
            method,
            params,
            subscription
          } = handler;

          const result = (0, _classPrivateFieldLooseBase2.default)(this, _coder)[_coder].decodeResponse(response); // first send the result - in case of subs, we may have an update
          // immediately if we have some queued results already


          handler.callback(null, result);

          if (subscription) {
            const subId = `${subscription.type}::${result}`;
            (0, _classPrivateFieldLooseBase2.default)(this, _subscriptions)[_subscriptions][subId] = _objectSpread(_objectSpread({}, subscription), {}, {
              method,
              params
            }); // if we have a result waiting for this subscription already

            if ((0, _classPrivateFieldLooseBase2.default)(this, _waitingForId)[_waitingForId][subId]) {
              (0, _classPrivateFieldLooseBase2.default)(this, _onSocketMessageSubscribe)[_onSocketMessageSubscribe]((0, _classPrivateFieldLooseBase2.default)(this, _waitingForId)[_waitingForId][subId]);
            }
          }
        } catch (error) {
          handler.callback(error, undefined);
        }

        delete (0, _classPrivateFieldLooseBase2.default)(this, _handlers)[_handlers][response.id];
      }
    });
    Object.defineProperty(this, _onSocketMessageSubscribe, {
      writable: true,
      value: response => {
        const method = ALIASES[response.method] || response.method || 'invalid';
        const subId = `${method}::${response.params.subscription}`;

        const handler = (0, _classPrivateFieldLooseBase2.default)(this, _subscriptions)[_subscriptions][subId];

        if (!handler) {
          // store the JSON, we could have out-of-order subid coming in
          (0, _classPrivateFieldLooseBase2.default)(this, _waitingForId)[_waitingForId][subId] = response;
          l.debug(() => `Unable to find handler for subscription=${subId}`);
          return;
        } // housekeeping


        delete (0, _classPrivateFieldLooseBase2.default)(this, _waitingForId)[_waitingForId][subId];

        try {
          const result = (0, _classPrivateFieldLooseBase2.default)(this, _coder)[_coder].decodeResponse(response);

          handler.callback(null, result);
        } catch (error) {
          handler.callback(error, undefined);
        }
      }
    });
    Object.defineProperty(this, _onSocketOpen, {
      writable: true,
      value: () => {
        (0, _util.assert)(!(0, _util.isNull)((0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket]), 'WebSocket cannot be null in onOpen');
        l.debug(() => ['connected to', (0, _classPrivateFieldLooseBase2.default)(this, _endpoints)[_endpoints][(0, _classPrivateFieldLooseBase2.default)(this, _endpointIndex)[_endpointIndex]]]);
        (0, _classPrivateFieldLooseBase2.default)(this, _isConnected)[_isConnected] = true;

        (0, _classPrivateFieldLooseBase2.default)(this, _emit)[_emit]('connected');

        (0, _classPrivateFieldLooseBase2.default)(this, _resubscribe)[_resubscribe]();

        return true;
      }
    });
    Object.defineProperty(this, _resubscribe, {
      writable: true,
      value: () => {
        const subscriptions = (0, _classPrivateFieldLooseBase2.default)(this, _subscriptions)[_subscriptions];

        (0, _classPrivateFieldLooseBase2.default)(this, _subscriptions)[_subscriptions] = {};
        Promise.all(Object.keys(subscriptions).map(async id => {
          const {
            callback,
            method,
            params,
            type
          } = subscriptions[id]; // only re-create subscriptions which are not in author (only area where
          // transactions are created, i.e. submissions such as 'author_submitAndWatchExtrinsic'
          // are not included (and will not be re-broadcast)

          if (type.startsWith('author_')) {
            return;
          }

          try {
            await this.subscribe(type, method, params, callback);
          } catch (error) {
            l.error(error);
          }
        })).catch(l.error);
      }
    });
    const endpoints = Array.isArray(endpoint) ? endpoint : [endpoint];
    (0, _util.assert)(endpoints.length !== 0, 'WsProvider requires at least one Endpoint');
    endpoints.forEach(endpoint => {
      (0, _util.assert)(/^(wss|ws):\/\//.test(endpoint), () => `Endpoint should start with 'ws://', received '${endpoint}'`);
    });
    (0, _classPrivateFieldLooseBase2.default)(this, _eventemitter)[_eventemitter] = new _eventemitter2.default();
    (0, _classPrivateFieldLooseBase2.default)(this, _autoConnectMs)[_autoConnectMs] = autoConnectMs || 0;
    (0, _classPrivateFieldLooseBase2.default)(this, _coder)[_coder] = new _index.RpcCoder();
    (0, _classPrivateFieldLooseBase2.default)(this, _endpointIndex)[_endpointIndex] = -1;
    (0, _classPrivateFieldLooseBase2.default)(this, _endpoints)[_endpoints] = endpoints;
    (0, _classPrivateFieldLooseBase2.default)(this, _headers)[_headers] = headers;
    (0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket] = null;

    if (autoConnectMs > 0) {
      this.connectWithRetry().catch(() => {// does not throw
      });
    }

    (0, _classPrivateFieldLooseBase2.default)(this, _isReadyPromise)[_isReadyPromise] = new Promise(resolve => {
      (0, _classPrivateFieldLooseBase2.default)(this, _eventemitter)[_eventemitter].once('connected', () => {
        resolve(this);
      });
    });
  }
  /**
   * @summary `true` when this provider supports subscriptions
   */


  get hasSubscriptions() {
    return true;
  }
  /**
   * @summary Whether the node is connected or not.
   * @return {boolean} true if connected
   */


  get isConnected() {
    return (0, _classPrivateFieldLooseBase2.default)(this, _isConnected)[_isConnected];
  }
  /**
   * @description Promise that resolves the first time we are connected and loaded
   */


  get isReady() {
    return (0, _classPrivateFieldLooseBase2.default)(this, _isReadyPromise)[_isReadyPromise];
  }
  /**
   * @description Returns a clone of the object
   */


  clone() {
    return new WsProvider((0, _classPrivateFieldLooseBase2.default)(this, _endpoints)[_endpoints]);
  }
  /**
   * @summary Manually connect
   * @description The [[WsProvider]] connects automatically by default, however if you decided otherwise, you may
   * connect manually using this method.
   */
  // eslint-disable-next-line @typescript-eslint/require-await


  async connect() {
    try {
      (0, _classPrivateFieldLooseBase2.default)(this, _endpointIndex)[_endpointIndex] = ((0, _classPrivateFieldLooseBase2.default)(this, _endpointIndex)[_endpointIndex] + 1) % (0, _classPrivateFieldLooseBase2.default)(this, _endpoints)[_endpoints].length;
      (0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket] = typeof _xGlobal.xglobal.WebSocket !== 'undefined' && (0, _util.isChildClass)(_xGlobal.xglobal.WebSocket, _xWs.WebSocket) ? new _xWs.WebSocket((0, _classPrivateFieldLooseBase2.default)(this, _endpoints)[_endpoints][(0, _classPrivateFieldLooseBase2.default)(this, _endpointIndex)[_endpointIndex]]) // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - WS may be an instance of w3cwebsocket, which supports headers
      : new _xWs.WebSocket((0, _classPrivateFieldLooseBase2.default)(this, _endpoints)[_endpoints][(0, _classPrivateFieldLooseBase2.default)(this, _endpointIndex)[_endpointIndex]], undefined, undefined, (0, _classPrivateFieldLooseBase2.default)(this, _headers)[_headers], undefined, {
        // default: true
        fragmentOutgoingMessages: true,
        // default: 16K (bump, the Node has issues with too many fragments, e.g. on setCode)
        fragmentationThreshold: 256 * 1024,
        // default: 8MB (however AXIA api.query.staking.erasStakers.entries(356) is over that)
        maxReceivedMessageSize: 16 * 1024 * 1024
      });
      (0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket].onclose = (0, _classPrivateFieldLooseBase2.default)(this, _onSocketClose)[_onSocketClose];
      (0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket].onerror = (0, _classPrivateFieldLooseBase2.default)(this, _onSocketError)[_onSocketError];
      (0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket].onmessage = (0, _classPrivateFieldLooseBase2.default)(this, _onSocketMessage)[_onSocketMessage];
      (0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket].onopen = (0, _classPrivateFieldLooseBase2.default)(this, _onSocketOpen)[_onSocketOpen];
    } catch (error) {
      l.error(error);

      (0, _classPrivateFieldLooseBase2.default)(this, _emit)[_emit]('error', error);

      throw error;
    }
  }
  /**
   * @description Connect, never throwing an error, but rather forcing a retry
   */


  async connectWithRetry() {
    if ((0, _classPrivateFieldLooseBase2.default)(this, _autoConnectMs)[_autoConnectMs] > 0) {
      try {
        await this.connect();
      } catch (error) {
        setTimeout(() => {
          this.connectWithRetry().catch(() => {// does not throw
          });
        }, (0, _classPrivateFieldLooseBase2.default)(this, _autoConnectMs)[_autoConnectMs]);
      }
    }
  }
  /**
   * @description Manually disconnect from the connection, clearing auto-connect logic
   */
  // eslint-disable-next-line @typescript-eslint/require-await


  async disconnect() {
    // switch off autoConnect, we are in manual mode now
    (0, _classPrivateFieldLooseBase2.default)(this, _autoConnectMs)[_autoConnectMs] = 0;

    try {
      if ((0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket]) {
        // 1000 - Normal closure; the connection successfully completed
        (0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket].close(1000);
      }
    } catch (error) {
      l.error(error);

      (0, _classPrivateFieldLooseBase2.default)(this, _emit)[_emit]('error', error);

      throw error;
    }
  }
  /**
   * @summary Listens on events after having subscribed using the [[subscribe]] function.
   * @param  {ProviderInterfaceEmitted} type Event
   * @param  {ProviderInterfaceEmitCb}  sub  Callback
   * @return unsubscribe function
   */


  on(type, sub) {
    (0, _classPrivateFieldLooseBase2.default)(this, _eventemitter)[_eventemitter].on(type, sub);

    return () => {
      (0, _classPrivateFieldLooseBase2.default)(this, _eventemitter)[_eventemitter].removeListener(type, sub);
    };
  }
  /**
   * @summary Send JSON data using WebSockets to configured HTTP Endpoint or queue.
   * @param method The RPC methods to execute
   * @param params Encoded parameters as applicable for the method
   * @param subscription Subscription details (internally used)
   */


  send(method, params, subscription) {
    return new Promise((resolve, reject) => {
      try {
        (0, _util.assert)(this.isConnected && !(0, _util.isNull)((0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket]), 'WebSocket is not connected');

        const json = (0, _classPrivateFieldLooseBase2.default)(this, _coder)[_coder].encodeJson(method, params);

        const id = (0, _classPrivateFieldLooseBase2.default)(this, _coder)[_coder].getId();

        const callback = (error, result) => {
          error ? reject(error) : resolve(result);
        };

        l.debug(() => ['calling', method, json]);
        (0, _classPrivateFieldLooseBase2.default)(this, _handlers)[_handlers][id] = {
          callback,
          method,
          params,
          subscription
        };

        (0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket].send(json);
      } catch (error) {
        reject(error);
      }
    });
  }
  /**
   * @name subscribe
   * @summary Allows subscribing to a specific event.
   *
   * @example
   * <BR>
   *
   * ```javascript
   * const provider = new WsProvider('ws://127.0.0.1:9944');
   * const rpc = new Rpc(provider);
   *
   * rpc.state.subscribeStorage([[storage.system.account, <Address>]], (_, values) => {
   *   console.log(values)
   * }).then((subscriptionId) => {
   *   console.log('balance changes subscription id: ', subscriptionId)
   * })
   * ```
   */


  subscribe(type, method, params, callback) {
    return this.send(method, params, {
      callback,
      type
    });
  }
  /**
   * @summary Allows unsubscribing to subscriptions made with [[subscribe]].
   */


  async unsubscribe(type, method, id) {
    const subscription = `${type}::${id}`; // FIXME This now could happen with re-subscriptions. The issue is that with a re-sub
    // the assigned id now does not match what the API user originally received. It has
    // a slight complication in solving - since we cannot rely on the send id, but rather
    // need to find the actual subscription id to map it

    if ((0, _util.isUndefined)((0, _classPrivateFieldLooseBase2.default)(this, _subscriptions)[_subscriptions][subscription])) {
      l.debug(() => `Unable to find active subscription=${subscription}`);
      return false;
    }

    delete (0, _classPrivateFieldLooseBase2.default)(this, _subscriptions)[_subscriptions][subscription];

    try {
      return this.isConnected && !(0, _util.isNull)((0, _classPrivateFieldLooseBase2.default)(this, _websocket)[_websocket]) ? this.send(method, [id]) : true;
    } catch (error) {
      return false;
    }
  }

}

exports.WsProvider = WsProvider;