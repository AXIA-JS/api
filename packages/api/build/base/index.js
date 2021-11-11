import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Copyright 2017-2021 @axia-js/api authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { assert, isString, u8aToHex, u8aToU8a } from '@axia-js/util';
import { Getters } from "./Getters.js";
export class ApiBase extends Getters {
  /**
   * @description Create an instance of the class
   *
   * @param options Options object to create API instance or a Provider instance
   *
   * @example
   * <BR>
   *
   * ```javascript
   * import Api from '@axia-js/api/promise';
   *
   * const api = new Api().isReady();
   *
   * api.rpc.subscribeNewHeads((header) => {
   *   console.log(`new block #${header.number.toNumber()}`);
   * });
   * ```
   */
  constructor(options = {}, type, decorateMethod) {
    super(options, type, decorateMethod);
  }
  /**
   * @description Connect from the underlying provider, halting all network traffic
   */


  connect() {
    return this._rpcCore.connect();
  }
  /**
   * @description Disconnect from the underlying provider, halting all network traffic
   */


  disconnect() {
    this._unsubscribe();

    return this._rpcCore.disconnect();
  }
  /**
   * @description Finds the definition for a specific [[CallFunction]] based on the index supplied
   */


  findCall(callIndex) {
    return this.registry.findMetaCall(u8aToU8a(callIndex));
  }
  /**
   * @description Finds the definition for a specific [[RegistryError]] based on the index supplied
   */


  findError(errorIndex) {
    return this.registry.findMetaError(u8aToU8a(errorIndex));
  }
  /**
   * @description Set an external signer which will be used to sign extrinsic when account passed in is not KeyringPair
   */


  setSigner(signer) {
    this._rx.signer = signer;
  }
  /**
   * @description Signs a raw signer payload, string or Uint8Array
   */


  async sign(address, data, {
    signer
  } = {}) {
    if (isString(address)) {
      const _signer = signer || this._rx.signer;

      assert(_signer === null || _signer === void 0 ? void 0 : _signer.signRaw, 'No signer exists with a signRaw interface. You possibly need to pass through an explicit keypair for the origin so it can be used for signing.');
      return (await _signer.signRaw(_objectSpread(_objectSpread({
        type: 'bytes'
      }, data), {}, {
        address
      }))).signature;
    }

    return u8aToHex(address.sign(u8aToU8a(data.data)));
  }

}