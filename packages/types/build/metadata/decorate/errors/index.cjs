"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decorateErrors = decorateErrors;
exports.variantToMeta = variantToMeta;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _util = require("@axia-js/util");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function variantToMeta(lookup, variant) {
  return _objectSpread(_objectSpread({}, variant), {}, {
    args: variant.fields.map(({
      type
    }) => lookup.getTypeDef(type).type)
  });
}
/** @internal */


function decorateErrors(registry, {
  lookup,
  pallets
}, metaVersion) {
  return pallets.reduce((result, {
    errors,
    index,
    name
  }, _sectionIndex) => {
    if (!errors.isSome) {
      return result;
    }

    const sectionIndex = metaVersion >= 12 ? index.toNumber() : _sectionIndex;
    result[(0, _util.stringCamelCase)(name)] = lookup.getSiType(errors.unwrap().type).def.asVariant.variants.reduce((newModule, variant) => {
      // we don't camelCase the error name
      newModule[variant.name.toString()] = {
        is: ({
          error,
          index
        }) => index.eq(sectionIndex) && error.eq(variant.index),
        meta: registry.createType('ErrorMetadataLatest', variantToMeta(lookup, variant))
      };
      return newModule;
    }, {});
    return result;
  }, {});
}