"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateDefaultEvents = generateDefaultEvents;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _handlebars = _interopRequireDefault(require("handlebars"));

var _definitions = _interopRequireDefault(require("@axia-js/types/augment/lookup/definitions"));

var defaultDefs = _interopRequireWildcard(require("@axia-js/types/interfaces/definitions"));

var _util = require("@axia-js/util");

var _index = require("../util/index.cjs");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const template = (0, _index.readTemplate)('events');

const generateForMetaTemplate = _handlebars.default.compile(template);
/** @internal */


function generateForMeta(meta, dest, extraTypes, isStrict) {
  (0, _index.writeFile)(dest, () => {
    const allTypes = _objectSpread({
      '@axia-js/types/augment': {
        lookup: _definitions.default
      },
      '@axia-js/types/interfaces': defaultDefs
    }, extraTypes);

    const imports = (0, _index.createImports)(allTypes);
    const allDefs = Object.entries(allTypes).reduce((defs, [path, obj]) => {
      return Object.entries(obj).reduce((defs, [key, value]) => _objectSpread(_objectSpread({}, defs), {}, {
        [`${path}/${key}`]: value
      }), defs);
    }, {});
    const {
      lookup,
      pallets,
      registry
    } = meta.asLatest;
    const modules = pallets.filter(({
      events
    }) => events.isSome).map(({
      events,
      name
    }) => ({
      items: lookup.getSiType(events.unwrap().type).def.asVariant.variants.map(({
        docs,
        fields,
        name
      }) => {
        const args = fields.map(({
          type
        }) => lookup.getTypeDef(type)).map(typeDef => typeDef.lookupName || (0, _index.formatType)(registry, allDefs, typeDef, imports));
        (0, _index.setImports)(allDefs, imports, args);
        return {
          docs,
          name: name.toString(),
          type: args.join(', ')
        };
      }).sort(_index.compareName),
      name: (0, _util.stringCamelCase)(name)
    })).sort(_index.compareName);
    return generateForMetaTemplate({
      headerType: 'chain',
      imports,
      isStrict,
      modules,
      types: [...Object.keys(imports.localTypes).sort().map(packagePath => ({
        file: packagePath.replace('@axia-js/types/augment', '@axia-js/types'),
        types: Object.keys(imports.localTypes[packagePath])
      })), {
        file: '@axia-js/api/types',
        types: ['ApiTypes']
      }]
    });
  });
} // Call `generateForMeta()` with current static metadata

/** @internal */


function generateDefaultEvents(dest = 'packages/api/src/augment/events.ts', data, extraTypes = {}, isStrict = false) {
  const {
    metadata
  } = (0, _index.initMeta)(data, extraTypes);
  return generateForMeta(metadata, dest, extraTypes, isStrict);
}