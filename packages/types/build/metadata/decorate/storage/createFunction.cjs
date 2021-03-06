"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createFunction = createFunction;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _util = require("@axia-js/util");

var _utilCrypto = require("@axia-js/util-crypto");

var _index = require("../../../codec/index.cjs");

var _getHasher = require("./getHasher.cjs");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

/** @internal */
function createKeyRaw(registry, itemFn, keys, hashers, args) {
  return (0, _util.u8aConcat)((0, _utilCrypto.xxhashAsU8a)(itemFn.prefix, 128), (0, _utilCrypto.xxhashAsU8a)(itemFn.method, 128), ...keys.map((type, index) => (0, _getHasher.getHasher)(hashers[index])(registry.createType(registry.createLookupType(type), args[index]).toU8a())));
}
/** @internal */


function createKey(registry, itemFn, keys, hashers, args) {
  const {
    method,
    section
  } = itemFn;
  (0, _util.assert)(Array.isArray(args), () => `Call to ${(0, _util.stringCamelCase)(section || 'unknown')}.${(0, _util.stringCamelCase)(method || 'unknown')} needs ${keys.length} arguments`);
  (0, _util.assert)(args.filter(a => !(0, _util.isUndefined)(a)).length === keys.length, () => `Call to ${(0, _util.stringCamelCase)(section || 'unknown')}.${(0, _util.stringCamelCase)(method || 'unknown')} needs ${keys.length} arguments, found [${args.join(', ')}]`); // as per createKey, always add the length prefix (underlying it is Bytes)

  return (0, _util.compactAddLength)(createKeyRaw(registry, itemFn, keys, hashers, args));
}
/** @internal */


function expandWithMeta(_ref, _storageFn) {
  let {
    meta,
    method,
    prefix,
    section
  } = _ref;
  const storageFn = _storageFn;
  storageFn.meta = meta;
  storageFn.method = (0, _util.stringLowerFirst)(method);
  storageFn.prefix = prefix;
  storageFn.section = section; // explicitly add the actual method in the toJSON, this gets used to determine caching and without it
  // instances (e.g. collective) will not work since it is only matched on param meta

  storageFn.toJSON = () => _objectSpread(_objectSpread({}, meta.toJSON()), {}, {
    storage: {
      method,
      prefix,
      section
    }
  });

  return storageFn;
}
/** @internal */


function extendHeadMeta(registry, _ref2, _ref3, iterFn) {
  let {
    meta: {
      docs,
      name,
      type
    },
    section
  } = _ref2;
  let {
    method
  } = _ref3;
  const outputType = registry.createLookupType(type.asMap.key); // metadata with a fallback value using the type of the key, the normal
  // meta fallback only applies to actual entry values, create one for head

  iterFn.meta = registry.createType('StorageEntryMetadataLatest', {
    docs,
    fallback: registry.createType('Bytes'),
    modifier: registry.createType('StorageEntryModifierLatest', 1),
    // required
    name,
    // FIXME???
    type: registry.createType('StorageEntryTypeLatest', outputType, 0)
  });
  return function () {
    return registry.createType('StorageKey', iterFn(...arguments), {
      method,
      section
    });
  };
}
/** @internal */


function extendPrefixedMap(registry, itemFn, storageFn) {
  const {
    meta: {
      type
    },
    method,
    section
  } = itemFn;
  storageFn.iterKey = extendHeadMeta(registry, itemFn, storageFn, function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    (0, _util.assert)(args.length === 0 || type.isMap && args.length < type.asMap.hashers.length, () => `Iteration ${(0, _util.stringCamelCase)(section || 'unknown')}.${(0, _util.stringCamelCase)(method || 'unknown')} needs arguments to be at least one less than the full arguments, found [${args.join(', ')}]`);

    if (args.length) {
      if (type.isMap) {
        const {
          hashers,
          key
        } = type.asMap;
        const keysVec = hashers.length === 1 ? [key] : [...registry.lookup.getSiType(key).def.asTuple.map(t => t)];
        const hashersVec = [...hashers];
        return new _index.Raw(registry, createKeyRaw(registry, itemFn, keysVec.slice(0, args.length), hashersVec.slice(0, args.length), args));
      }
    }

    return new _index.Raw(registry, createKeyRaw(registry, itemFn, [], [], []));
  });
  return storageFn;
}
/** @internal */


function createFunction(registry, itemFn, options) {
  const {
    meta: {
      type
    }
  } = itemFn; // Can only have zero or one argument:
  //   - storage.system.account(address)
  //   - storage.timestamp.blockPeriod()
  // For higher-map queries the params are passed in as an tuple, [key1, key2]

  const storageFn = expandWithMeta(itemFn, function () {
    if (type.isPlain) {
      return options.skipHashing ? (0, _util.compactAddLength)((0, _util.u8aToU8a)(options.key)) : createKey(registry, itemFn, [], [], []);
    }

    const {
      hashers,
      key
    } = type.asMap;

    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return hashers.length === 1 ? createKey(registry, itemFn, [key], hashers, args) : createKey(registry, itemFn, registry.lookup.getSiType(key).def.asTuple.map(t => t), hashers, args);
  });

  if (type.isMap) {
    extendPrefixedMap(registry, itemFn, storageFn);
  }

  storageFn.keyPrefix = function () {
    return storageFn.iterKey && storageFn.iterKey(...arguments) || (0, _util.compactStripLength)(storageFn())[1];
  };

  return storageFn;
}