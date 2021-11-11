"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Init = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classPrivateFieldLooseBase2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseBase"));

var _classPrivateFieldLooseKey2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseKey"));

var _rxjs = require("rxjs");

var _types = require("@axia-js/types");

var _typesKnown = require("@axia-js/types-known");

var _util = require("@axia-js/util");

var _utilCrypto = require("@axia-js/util-crypto");

var _capabilities = require("./capabilities.cjs");

var _Decorate = require("./Decorate.cjs");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const KEEPALIVE_INTERVAL = 10000;
const l = (0, _util.logger)('api/init');

var _healthTimer = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("healthTimer");

var _registries = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("registries");

var _updateSub = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("updateSub");

var _onProviderConnect = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("onProviderConnect");

var _onProviderDisconnect = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("onProviderDisconnect");

var _onProviderError = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("onProviderError");

class Init extends _Decorate.Decorate {
  constructor(options, type, decorateMethod) {
    super(options, type, decorateMethod); // all injected types added to the registry for overrides

    Object.defineProperty(this, _healthTimer, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _registries, {
      writable: true,
      value: []
    });
    Object.defineProperty(this, _updateSub, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _onProviderConnect, {
      writable: true,
      value: async () => {
        this._isConnected.next(true);

        this.emit('connected');

        try {
          const [hasMeta, cryptoReady] = await Promise.all([this._loadMeta(), this._options.initWasm === false ? Promise.resolve(true) : (0, _utilCrypto.cryptoWaitReady)()]);

          this._subscribeHealth();

          if (hasMeta && !this._isReady && cryptoReady) {
            this._isReady = true;
            this.emit('ready', this);
          }
        } catch (_error) {
          const error = new Error(`FATAL: Unable to initialize the API: ${_error.message}`);
          l.error(error);
          this.emit('error', error);
        }
      }
    });
    Object.defineProperty(this, _onProviderDisconnect, {
      writable: true,
      value: () => {
        this._isConnected.next(false);

        this._unsubscribeHealth();

        this.emit('disconnected');
      }
    });
    Object.defineProperty(this, _onProviderError, {
      writable: true,
      value: error => {
        this.emit('error', error);
      }
    });
    this.registry.setKnownTypes(options); // We only register the types (global) if this is not a cloned instance.
    // Do right up-front, so we get in the user types before we are actually
    // doing anything on-chain, this ensures we have the overrides in-place

    if (!options.source) {
      this.registerTypes(options.types);
    } else {
      (0, _classPrivateFieldLooseBase2.default)(this, _registries)[_registries] = (0, _classPrivateFieldLooseBase2.default)(options.source, _registries)[_registries];
    }

    this._rpc = this._decorateRpc(this._rpcCore, this._decorateMethod);
    this._rx.rpc = this._decorateRpc(this._rpcCore, this._rxDecorateMethod);

    if (this.supportMulti) {
      this._queryMulti = this._decorateMulti(this._decorateMethod);
      this._rx.queryMulti = this._decorateMulti(this._rxDecorateMethod);
    }

    this._rx.signer = options.signer;

    this._rpcCore.setRegistrySwap(blockHash => this.getBlockRegistry(blockHash));

    if (this.hasSubscriptions) {
      this._rpcCore.provider.on('disconnected', (0, _classPrivateFieldLooseBase2.default)(this, _onProviderDisconnect)[_onProviderDisconnect]);

      this._rpcCore.provider.on('error', (0, _classPrivateFieldLooseBase2.default)(this, _onProviderError)[_onProviderError]);

      this._rpcCore.provider.on('connected', (0, _classPrivateFieldLooseBase2.default)(this, _onProviderConnect)[_onProviderConnect]);
    } else {
      l.warn('Api will be available in a limited mode since the provider does not support subscriptions');
    } // If the provider was instantiated earlier, and has already emitted a
    // 'connected' event, then the `on('connected')` won't fire anymore. To
    // cater for this case, we call manually `this._onProviderConnect`.


    if (this._rpcCore.provider.isConnected) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      (0, _classPrivateFieldLooseBase2.default)(this, _onProviderConnect)[_onProviderConnect]();
    }
  }
  /**
   * @description Decorates a registry based on the runtime version
   */


  _initRegistry(registry, chain, version, metadata, chainProps) {
    registry.setChainProperties(chainProps || this.registry.getChainProperties());
    registry.setKnownTypes(this._options);
    registry.register((0, _typesKnown.getSpecTypes)(registry, chain, version.specName, version.specVersion));
    registry.setHasher((0, _typesKnown.getSpecHasher)(registry, chain, version.specName)); // for bundled types, pull through the aliases defined

    if (registry.knownTypes.typesBundle) {
      registry.knownTypes.typesAlias = (0, _typesKnown.getSpecAlias)(registry, chain, version.specName);
    }

    registry.setMetadata(metadata, undefined, _objectSpread(_objectSpread({}, (0, _typesKnown.getSpecExtensions)(registry, chain, version.specName)), this._options.signedExtensions || {}));
  }
  /**
   * @description Returns the default versioned registry
   */


  _getDefaultRegistry() {
    // get the default registry version
    const thisRegistry = (0, _classPrivateFieldLooseBase2.default)(this, _registries)[_registries].find(({
      isDefault
    }) => isDefault);

    (0, _util.assert)(thisRegistry, 'Initialization error, cannot find the default registry');
    return thisRegistry;
  }
  /**
   * @description Returns a decorated API instance at a specific point in time
   */


  async at(blockHash) {
    const u8aHash = (0, _util.u8aToU8a)(blockHash);
    const registry = await this.getBlockRegistry(u8aHash); // always create a new decoration for this specific hash

    return this._createDecorated(registry, true, u8aHash).decoratedApi;
  }
  /**
   * @description Sets up a registry based on the block hash defined
   */


  async getBlockRegistry(blockHash) {
    const existingViaHash = (0, _classPrivateFieldLooseBase2.default)(this, _registries)[_registries].find(({
      lastBlockHash
    }) => lastBlockHash && (0, _util.u8aEq)(lastBlockHash, blockHash));

    if (existingViaHash) {
      return existingViaHash;
    } // ensure we have everything required


    (0, _util.assert)(this._genesisHash && this._runtimeVersion, 'Cannot retrieve data on an uninitialized chain'); // We have to assume that on the RPC layer the calls used here does not call back into
    // the registry swap, so getHeader & getRuntimeVersion should not be historic

    const header = this.registry.createType('HeaderPartial', this._genesisHash.eq(blockHash) ? {
      number: _util.BN_ZERO,
      parentHash: this._genesisHash
    } : await (0, _rxjs.firstValueFrom)(this._rpcCore.chain.getHeader.json(blockHash)));
    (0, _util.assert)(!header.parentHash.isEmpty, 'Unable to retrieve header and parent from supplied hash'); // get the runtime version, either on-chain or via an known upgrade history

    const [firstVersion, lastVersion] = (0, _typesKnown.getUpgradeVersion)(this._genesisHash, header.number);
    const version = this.registry.createType('RuntimeVersionPartial', firstVersion && (lastVersion || firstVersion.specVersion.eq(this._runtimeVersion.specVersion)) ? {
      specName: this._runtimeVersion.specName,
      specVersion: firstVersion.specVersion
    } : await (0, _rxjs.firstValueFrom)(this._rpcCore.state.getRuntimeVersion.json(header.parentHash))); // check for pre-existing registries. We also check specName, e.g. it
    // could be changed like in Westmint with upgrade from  shell -> westmint

    const existingViaVersion = (0, _classPrivateFieldLooseBase2.default)(this, _registries)[_registries].find(({
      specName,
      specVersion
    }) => specName.eq(version.specName) && specVersion.eq(version.specVersion));

    if (existingViaVersion) {
      existingViaVersion.lastBlockHash = blockHash;
      return existingViaVersion;
    } // nothing has been found, construct new


    const registry = new _types.TypeRegistry(blockHash);
    const metadata = new _types.Metadata(registry, await (0, _rxjs.firstValueFrom)(this._rpcCore.state.getMetadata.raw(header.parentHash)));

    this._initRegistry(registry, this._runtimeChain, version, metadata); // add our new registry


    const result = {
      lastBlockHash: blockHash,
      metadata,
      registry,
      specName: version.specName,
      specVersion: version.specVersion
    };

    (0, _classPrivateFieldLooseBase2.default)(this, _registries)[_registries].push(result); // TODO This could be useful for historic, disabled due to cross-looping, i.e. .at queries
    // this._detectCapabilities(registry, blockHash);


    return result;
  }

  async _loadMeta() {
    var _this$_options$source;

    // on re-connection to the same chain, we don't want to re-do everything from chain again
    if (this._isReady) {
      return true;
    }

    this._unsubscribeUpdates(); // only load from on-chain if we are not a clone (default path), alternatively
    // just use the values from the source instance provided


    [this._genesisHash, this._runtimeMetadata] = (_this$_options$source = this._options.source) !== null && _this$_options$source !== void 0 && _this$_options$source._isReady ? await this._metaFromSource(this._options.source) : await this._metaFromChain(this._options.metadata);
    return this._initFromMeta(this._runtimeMetadata);
  } // eslint-disable-next-line @typescript-eslint/require-await


  async _metaFromSource(source) {
    this._extrinsicType = source.extrinsicVersion;
    this._runtimeChain = source.runtimeChain;
    this._runtimeVersion = source.runtimeVersion;
    const methods = []; // manually build a list of all available methods in this RPC, we are
    // going to filter on it to align the cloned RPC without making a call

    Object.keys(source.rpc).forEach(section => {
      Object.keys(source.rpc[section]).forEach(method => {
        methods.push(`${section}_${method}`);
      });
    });

    this._filterRpc(methods, (0, _typesKnown.getSpecRpc)(this.registry, source.runtimeChain, source.runtimeVersion.specName));

    return [source.genesisHash, source.runtimeMetadata];
  }

  _detectCapabilities(registry, blockHash) {
    (0, _rxjs.firstValueFrom)((0, _capabilities.detectedCapabilities)(this._rx, blockHash)).then(types => {
      if (Object.keys(types).length) {
        registry.register(types);
        l.debug(() => `Capabilities detected${blockHash ? ` (${(0, _util.u8aToHex)((0, _util.u8aToU8a)(blockHash))})` : ''}: ${(0, _util.stringify)(types)}`);
      }
    }).catch(undefined);
    return true;
  } // subscribe to metadata updates, inject the types on changes


  _subscribeUpdates() {
    if ((0, _classPrivateFieldLooseBase2.default)(this, _updateSub)[_updateSub] || !this.hasSubscriptions) {
      return;
    }

    (0, _classPrivateFieldLooseBase2.default)(this, _updateSub)[_updateSub] = this._rpcCore.state.subscribeRuntimeVersion().pipe((0, _rxjs.switchMap)(version => {
      var _this$_runtimeVersion;

      return (// only retrieve the metadata when the on-chain version has been changed
        (_this$_runtimeVersion = this._runtimeVersion) !== null && _this$_runtimeVersion !== void 0 && _this$_runtimeVersion.specVersion.eq(version.specVersion) ? (0, _rxjs.of)(false) : this._rpcCore.state.getMetadata().pipe((0, _rxjs.map)(metadata => {
          l.log(`Runtime version updated to spec=${version.specVersion.toString()}, tx=${version.transactionVersion.toString()}`);
          this._runtimeMetadata = metadata;
          this._runtimeVersion = version;
          this._rx.runtimeVersion = version; // update the default registry version

          const thisRegistry = this._getDefaultRegistry(); // setup the data as per the current versions


          thisRegistry.metadata = metadata;
          thisRegistry.specVersion = version.specVersion; // clear the registry types to ensure that we override correctly

          this._initRegistry(thisRegistry.registry.init(), this._runtimeChain, version, metadata);

          this._injectMetadata(thisRegistry, false);

          return this._detectCapabilities(thisRegistry.registry);
        }))
      );
    })).subscribe();
  }

  async _metaFromChain(optMetadata) {
    const [genesisHash, runtimeVersion, chain, chainProps, rpcMethods, chainMetadata] = await Promise.all([(0, _rxjs.firstValueFrom)(this._rpcCore.chain.getBlockHash(0)), (0, _rxjs.firstValueFrom)(this._rpcCore.state.getRuntimeVersion()), (0, _rxjs.firstValueFrom)(this._rpcCore.system.chain()), (0, _rxjs.firstValueFrom)(this._rpcCore.system.properties()), (0, _rxjs.firstValueFrom)(this._rpcCore.rpc.methods()), optMetadata ? Promise.resolve(null) : (0, _rxjs.firstValueFrom)(this._rpcCore.state.getMetadata())]); // set our chain version & genesisHash as returned

    this._runtimeChain = chain;
    this._runtimeVersion = runtimeVersion;
    this._rx.runtimeVersion = runtimeVersion; // retrieve metadata, either from chain  or as pass-in via options

    const metadataKey = `${genesisHash.toHex() || '0x'}-${runtimeVersion.specVersion.toString()}`;
    const metadata = chainMetadata || (optMetadata && optMetadata[metadataKey] ? new _types.Metadata(this.registry, optMetadata[metadataKey]) : await (0, _rxjs.firstValueFrom)(this._rpcCore.state.getMetadata())); // initializes the registry & RPC

    this._initRegistry(this.registry, chain, runtimeVersion, metadata, chainProps);

    this._filterRpc(rpcMethods.methods.map(t => t.toString()), (0, _typesKnown.getSpecRpc)(this.registry, chain, runtimeVersion.specName));

    this._subscribeUpdates(); // setup the initial registry, when we have none


    if (!(0, _classPrivateFieldLooseBase2.default)(this, _registries)[_registries].length) {
      (0, _classPrivateFieldLooseBase2.default)(this, _registries)[_registries].push({
        isDefault: true,
        metadata,
        registry: this.registry,
        specName: runtimeVersion.specName,
        specVersion: runtimeVersion.specVersion
      });
    } // get unique types & validate


    metadata.getUniqTypes(this._options.throwOnUnknown || false);
    return [genesisHash, metadata];
  }

  _initFromMeta(metadata) {
    this._extrinsicType = metadata.asLatest.extrinsic.version.toNumber();
    this._rx.extrinsicType = this._extrinsicType;
    this._rx.genesisHash = this._genesisHash;
    this._rx.runtimeVersion = this._runtimeVersion; // must be set here
    // inject metadata and adjust the types as detected

    this._injectMetadata(this._getDefaultRegistry(), true); // derive is last, since it uses the decorated rx


    this._rx.derive = this._decorateDeriveRx(this._rxDecorateMethod);
    this._derive = this._decorateDerive(this._decorateMethod); // detect the on-chain capabilities

    this._detectCapabilities(this.registry);

    return true;
  }

  _subscribeHealth() {
    // Only enable the health keepalive on WS, not needed on HTTP
    (0, _classPrivateFieldLooseBase2.default)(this, _healthTimer)[_healthTimer] = this.hasSubscriptions ? setInterval(() => {
      (0, _rxjs.firstValueFrom)(this._rpcCore.system.health()).catch(() => undefined);
    }, KEEPALIVE_INTERVAL) : null;
  }

  _unsubscribeHealth() {
    if ((0, _classPrivateFieldLooseBase2.default)(this, _healthTimer)[_healthTimer]) {
      clearInterval((0, _classPrivateFieldLooseBase2.default)(this, _healthTimer)[_healthTimer]);
      (0, _classPrivateFieldLooseBase2.default)(this, _healthTimer)[_healthTimer] = null;
    }
  }

  _unsubscribeUpdates() {
    if ((0, _classPrivateFieldLooseBase2.default)(this, _updateSub)[_updateSub]) {
      (0, _classPrivateFieldLooseBase2.default)(this, _updateSub)[_updateSub].unsubscribe();

      (0, _classPrivateFieldLooseBase2.default)(this, _updateSub)[_updateSub] = null;
    }
  }

  _unsubscribe() {
    this._unsubscribeHealth();

    this._unsubscribeUpdates();
  }

}

exports.Init = Init;