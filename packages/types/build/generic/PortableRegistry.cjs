"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GenericPortableRegistry = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classPrivateFieldLooseBase2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseBase"));

var _classPrivateFieldLooseKey2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseKey"));

var _util = require("@axia-js/util");

var _Struct = require("../codec/Struct.cjs");

var _encodeTypes = require("../create/encodeTypes.cjs");

var _getTypeDef = require("../create/getTypeDef.cjs");

var _index = require("../types/index.cjs");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Just a placeholder for a type.unrwapOr()
const TYPE_UNWRAP = {
  toNumber: () => -1
}; // Alias the primitive enum with out known values

const PRIMITIVE_ALIAS = {
  Char: 'u32',
  // Rust char is 4-bytes
  Str: 'Text'
}; // These are types where we have a specific decoding/encoding override + helpers

const PRIMITIVE_PATHS = [// match {node, axia, ...}_runtime
'*_runtime::Call', '*_runtime::Event', // these have a specific encoding or logic (for pallets)
'pallet_democracy::vote::Vote', 'pallet_identity::types::Data', // these are well-known types with additional encoding
'sp_core::crypto::AccountId32', 'sp_runtime::generic::era::Era', 'sp_runtime::multiaddress::MultiAddress', // shorten some well-known types
'primitive_types::*', 'sp_arithmetic::per_things::*', // ink!
'ink_env::types::*'].map(p => p.split('::')); // Mappings for types that should be converted to set via BitVec

const SETS = ['pallet_identity::types::BitFlags'].map(p => p.split('::')); // These we never use these as top-level names, they are wrappers

const WRAPPERS = ['BoundedBTreeMap', 'BoundedVec', 'Box', 'BTreeMap', 'Cow', 'Result', 'Option', 'WeakBoundedVec']; // These are reserved and/or conflicts with built-in Codec definitions

const RESERVED = ['call', 'entries', 'hash', 'keys', 'new', 'size'];

function matchParts(first, second) {
  return first.length === second.length && first.every((a, index) => {
    const b = second[index].toString();
    return a === '*' || a === b || a.includes('*') && a.includes('_') && b.includes('_') && matchParts(a.split('_'), b.split('_'));
  });
} // check if the path matches the PRIMITIVE_SP (with wildcards)


function getPrimitivePath(path) {
  // TODO We need to handle ink! Balance in some way
  return path.length && PRIMITIVE_PATHS.some(p => matchParts(p, path)) ? path[path.length - 1].toString() : null;
}

function removeDuplicateNames(lookup, names) {
  const rewrite = {};
  return names.map(_ref => {
    let [lookupIndex, name, params] = _ref;

    if (!name) {
      return [lookupIndex, null];
    } // those where the name is matching


    const allSame = names.filter(_ref2 => {
      let [, oName] = _ref2;
      return name === oName;
    }); // are there among matching names

    const anyDiff = allSame.some(_ref3 => {
      let [oIndex,, oParams] = _ref3;
      return lookupIndex !== oIndex && (params.length !== oParams.length || params.some((p, index) => !p.name.eq(oParams[index].name) || p.type.unwrapOr(TYPE_UNWRAP).toNumber() !== oParams[index].type.unwrapOr(TYPE_UNWRAP).toNumber()));
    }); // everything matches, we can combine these

    if (!anyDiff || !allSame[0][2].length) {
      return [lookupIndex, name];
    } // find the first parameter that yields differences


    const paramIdx = allSame[0][2].findIndex((_ref4, index) => {
      let {
        type
      } = _ref4;
      return allSame.every(_ref5 => {
        let [,, params] = _ref5;
        return params[index].type.isSome;
      }) && allSame.every((_ref6, aIndex) => {
        let [,, params] = _ref6;
        return aIndex === 0 || !params[index].type.eq(type);
      });
    }); // No param found that is different

    if (paramIdx === -1) {
      return [lookupIndex, name];
    } // see if using the param type helps


    const adjusted = allSame.map(_ref7 => {
      let [oIndex, oName, oParams] = _ref7;
      const {
        def,
        path
      } = lookup.getSiType(oParams[paramIdx].type.unwrap());

      if (!def.isPrimitive && !path.length) {
        return [oIndex, null];
      }

      return [oIndex, def.isPrimitive ? `${oName}${def.asPrimitive.toString()}` : `${oName}${path[path.length - 1].toString()}`];
    }); // any dupes remaining?

    const noDupes = adjusted.every(_ref8 => {
      let [i, n] = _ref8;
      return !!n && !adjusted.some(_ref9 => {
        let [ai, an] = _ref9;
        return i !== ai && n === an;
      });
    });

    if (noDupes) {
      // we filtered above for null names
      adjusted.forEach(_ref10 => {
        let [index, name] = _ref10;
        rewrite[index] = name;
      });
    }

    return noDupes ? [lookupIndex, name] : [lookupIndex, null];
  }).filter(n => !!n[1]).map(_ref11 => {
    let [lookupIndex, name] = _ref11;
    return [lookupIndex, rewrite[lookupIndex] || name];
  });
}

function extractName(types, _ref12) {
  let {
    id,
    type: {
      params,
      path
    }
  } = _ref12;
  const lookupIndex = id.toNumber();

  if (!path.length || WRAPPERS.includes(path[path.length - 1].toString())) {
    return [lookupIndex, null, []];
  }

  const parts = path.map(p => (0, _util.stringUpperFirst)((0, _util.stringCamelCase)(p))).filter((p, index) => ( // Remove ::{pallet, traits, types}::
  index !== 1 || !['Pallet', 'Traits', 'Types'].includes(p.toString())) && ( // sp_runtime::generic::digest::Digest -> sp_runtime::generic::Digest
  // sp_runtime::multiaddress::MultiAddress -> sp_runtime::MultiAddress
  index === path.length - 1 || p.toLowerCase() !== path[index + 1].toLowerCase()));
  let typeName = parts.join('');

  if (parts.length === 2 && parts[parts.length - 1] === 'RawOrigin' && params.length === 2 && params[1].type.isSome) {
    // Do magic for RawOrigin lookup
    const instanceType = types[params[1].type.unwrap().toNumber()];

    if (instanceType.type.path.length === 2) {
      typeName = `${typeName}${instanceType.type.path[1].toString()}`;
    }
  }

  return [lookupIndex, typeName, params];
}

function extractNames(lookup, types) {
  const dedup = removeDuplicateNames(lookup, types.map(t => extractName(types, t)));
  const [names, typesNew] = dedup.reduce((_ref13, _ref14) => {
    let [names, types] = _ref13;
    let [lookupIndex, name] = _ref14;
    // We set the name for this specific type
    names[lookupIndex] = name; // we map to the actual lookupIndex

    types[name] = lookup.registry.createLookupType(lookupIndex);
    return [names, types];
  }, [{}, {}]);
  lookup.registry.register(typesNew);
  return names;
}

var _names = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("names");

var _typeDefs = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("typeDefs");

var _createSiDef = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("createSiDef");

var _getLookupId = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("getLookupId");

var _extract = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extract");

var _extractArray = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractArray");

var _extractBitSequence = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractBitSequence");

var _extractCompact = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractCompact");

var _extractComposite = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractComposite");

var _extractCompositeSet = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractCompositeSet");

var _extractFields = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractFields");

var _extractFieldsAlias = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractFieldsAlias");

var _extractHistoric = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractHistoric");

var _extractPrimitive = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractPrimitive");

var _extractPrimitivePath = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractPrimitivePath");

var _extractSequence = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractSequence");

var _extractTuple = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractTuple");

var _extractVariant = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractVariant");

var _extractVariantEnum = /*#__PURE__*/(0, _classPrivateFieldLooseKey2.default)("extractVariantEnum");

class GenericPortableRegistry extends _Struct.Struct {
  constructor(registry, value) {
    super(registry, {
      types: 'Vec<PortableType>'
    }, value);
    Object.defineProperty(this, _extractVariantEnum, {
      value: _extractVariantEnum2
    });
    Object.defineProperty(this, _extractVariant, {
      value: _extractVariant2
    });
    Object.defineProperty(this, _extractTuple, {
      value: _extractTuple2
    });
    Object.defineProperty(this, _extractSequence, {
      value: _extractSequence2
    });
    Object.defineProperty(this, _extractPrimitivePath, {
      value: _extractPrimitivePath2
    });
    Object.defineProperty(this, _extractPrimitive, {
      value: _extractPrimitive2
    });
    Object.defineProperty(this, _extractHistoric, {
      value: _extractHistoric2
    });
    Object.defineProperty(this, _extractFieldsAlias, {
      value: _extractFieldsAlias2
    });
    Object.defineProperty(this, _extractFields, {
      value: _extractFields2
    });
    Object.defineProperty(this, _extractCompositeSet, {
      value: _extractCompositeSet2
    });
    Object.defineProperty(this, _extractComposite, {
      value: _extractComposite2
    });
    Object.defineProperty(this, _extractCompact, {
      value: _extractCompact2
    });
    Object.defineProperty(this, _extractBitSequence, {
      value: _extractBitSequence2
    });
    Object.defineProperty(this, _extractArray, {
      value: _extractArray2
    });
    Object.defineProperty(this, _extract, {
      value: _extract2
    });
    Object.defineProperty(this, _getLookupId, {
      value: _getLookupId2
    });
    Object.defineProperty(this, _createSiDef, {
      value: _createSiDef2
    });
    Object.defineProperty(this, _names, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _typeDefs, {
      writable: true,
      value: {}
    });
    (0, _classPrivateFieldLooseBase2.default)(this, _names)[_names] = extractNames(this, this.types);
  }
  /**
   * @description The types of the registry
   */


  get types() {
    return this.get('types');
  }
  /**
   * @description Returns the name for a specific lookup
   */


  getName(lookupId) {
    return (0, _classPrivateFieldLooseBase2.default)(this, _names)[_names][(0, _classPrivateFieldLooseBase2.default)(this, _getLookupId)[_getLookupId](lookupId)];
  }
  /**
   * @description Finds a specific type in the registry
   */


  getSiType(lookupId) {
    const found = this.types[(0, _classPrivateFieldLooseBase2.default)(this, _getLookupId)[_getLookupId](lookupId)];

    (0, _util.assert)(found, () => `PortableRegistry: Unable to find type with lookupId ${lookupId.toString()}`);
    return found.type;
  }
  /**
   * @description Lookup the type definition for the index
   */


  getTypeDef(lookupId) {
    const lookupIndex = (0, _classPrivateFieldLooseBase2.default)(this, _getLookupId)[_getLookupId](lookupId);

    if (!(0, _classPrivateFieldLooseBase2.default)(this, _typeDefs)[_typeDefs][lookupIndex]) {
      const lookupName = (0, _classPrivateFieldLooseBase2.default)(this, _names)[_names][lookupIndex];

      const empty = {
        info: _index.TypeDefInfo.DoNotConstruct,
        lookupIndex,
        lookupName,
        type: this.registry.createLookupType(lookupIndex)
      }; // Set named items since we will get into circular lookups along the way

      if (lookupName) {
        (0, _classPrivateFieldLooseBase2.default)(this, _typeDefs)[_typeDefs][lookupIndex] = empty;
      }

      const extracted = (0, _classPrivateFieldLooseBase2.default)(this, _extract)[_extract](this.getSiType(lookupId), lookupIndex); // For non-named items, we only set this right at the end


      if (!lookupName) {
        (0, _classPrivateFieldLooseBase2.default)(this, _typeDefs)[_typeDefs][lookupIndex] = empty;
      }

      Object.keys(extracted).forEach(k => {
        if (k !== 'lookupName' || extracted[k]) {
          // these are safe since we are looking through the keys as set
          (0, _classPrivateFieldLooseBase2.default)(this, _typeDefs)[_typeDefs][lookupIndex][k] = extracted[k];
        }
      }); // don't set lookupName on lower-level, we want to always direct to the type

      if (extracted.info === _index.TypeDefInfo.Plain) {
        (0, _classPrivateFieldLooseBase2.default)(this, _typeDefs)[_typeDefs][lookupIndex].lookupNameRoot = (0, _classPrivateFieldLooseBase2.default)(this, _typeDefs)[_typeDefs][lookupIndex].lookupName;
        delete (0, _classPrivateFieldLooseBase2.default)(this, _typeDefs)[_typeDefs][lookupIndex].lookupName;
      }
    }

    return (0, _classPrivateFieldLooseBase2.default)(this, _typeDefs)[_typeDefs][lookupIndex];
  }

}

exports.GenericPortableRegistry = GenericPortableRegistry;

function _createSiDef2(lookupId) {
  const typeDef = this.getTypeDef(lookupId);
  const lookupIndex = lookupId.toNumber(); // Setup for a lookup on complex types

  return [_index.TypeDefInfo.Enum, _index.TypeDefInfo.Struct].includes(typeDef.info) && typeDef.lookupName ? {
    docs: typeDef.docs,
    info: _index.TypeDefInfo.Si,
    lookupIndex,
    lookupName: (0, _classPrivateFieldLooseBase2.default)(this, _names)[_names][lookupIndex],
    type: this.registry.createLookupType(lookupId)
  } : typeDef;
}

function _getLookupId2(lookupId) {
  if ((0, _util.isString)(lookupId)) {
    (0, _util.assert)(this.registry.isLookupType(lookupId), () => `PortableRegistry: Expected a lookup string type, found ${lookupId}`);
    return parseInt(lookupId.replace('Lookup', ''), 10);
  } else if ((0, _util.isNumber)(lookupId)) {
    return lookupId;
  }

  return lookupId.toNumber();
}

function _extract2(type, lookupIndex) {
  const namespace = [...type.path].join('::');
  let typeDef;
  const primType = getPrimitivePath(type.path);

  try {
    if (primType) {
      typeDef = (0, _classPrivateFieldLooseBase2.default)(this, _extractPrimitivePath)[_extractPrimitivePath](lookupIndex, primType);
    } else if (type.def.isArray) {
      typeDef = (0, _classPrivateFieldLooseBase2.default)(this, _extractArray)[_extractArray](lookupIndex, type.def.asArray);
    } else if (type.def.isBitSequence) {
      typeDef = (0, _classPrivateFieldLooseBase2.default)(this, _extractBitSequence)[_extractBitSequence](lookupIndex, type.def.asBitSequence);
    } else if (type.def.isCompact) {
      typeDef = (0, _classPrivateFieldLooseBase2.default)(this, _extractCompact)[_extractCompact](lookupIndex, type.def.asCompact);
    } else if (type.def.isComposite) {
      typeDef = (0, _classPrivateFieldLooseBase2.default)(this, _extractComposite)[_extractComposite](lookupIndex, type, type.def.asComposite);
    } else if (type.def.isHistoricMetaCompat) {
      typeDef = (0, _classPrivateFieldLooseBase2.default)(this, _extractHistoric)[_extractHistoric](lookupIndex, type.def.asHistoricMetaCompat);
    } else if (type.def.isPrimitive) {
      typeDef = (0, _classPrivateFieldLooseBase2.default)(this, _extractPrimitive)[_extractPrimitive](lookupIndex, type);
    } else if (type.def.isSequence) {
      typeDef = (0, _classPrivateFieldLooseBase2.default)(this, _extractSequence)[_extractSequence](lookupIndex, type.def.asSequence);
    } else if (type.def.isTuple) {
      typeDef = (0, _classPrivateFieldLooseBase2.default)(this, _extractTuple)[_extractTuple](lookupIndex, type.def.asTuple);
    } else if (type.def.isVariant) {
      typeDef = (0, _classPrivateFieldLooseBase2.default)(this, _extractVariant)[_extractVariant](lookupIndex, type, type.def.asVariant);
    } else {
      throw new Error(`No SiTypeDef handler for ${type.def.toString()}`);
    }
  } catch (error) {
    throw new Error(`PortableRegistry: ${lookupIndex}${namespace ? ` (${namespace})` : ''}: Error extracting ${(0, _util.stringify)(type)}: ${error.message}`);
  }

  return _objectSpread({
    docs: type.docs.map(d => d.toString()),
    namespace
  }, typeDef);
}

function _extractArray2(_, _ref15) {
  let {
    len: length,
    type
  } = _ref15;
  (0, _util.assert)(!length || length.toNumber() <= 256, 'Only support for [Type; <length>], where length <= 256');
  return (0, _encodeTypes.withTypeString)(this.registry, {
    info: _index.TypeDefInfo.VecFixed,
    length: length.toNumber(),
    sub: (0, _classPrivateFieldLooseBase2.default)(this, _createSiDef)[_createSiDef](type)
  });
}

function _extractBitSequence2(_, _ref16) {
  let {
    bitOrderType,
    bitStoreType
  } = _ref16;

  const bitOrder = (0, _classPrivateFieldLooseBase2.default)(this, _createSiDef)[_createSiDef](bitOrderType);

  const bitStore = (0, _classPrivateFieldLooseBase2.default)(this, _createSiDef)[_createSiDef](bitStoreType); // NOTE: Currently the BitVec type is one-way only, i.e. we only use it to decode, not
  // re-encode stuff. As such we ignore the msb/lsb identifier given by bitOrderType, or rather
  // we don't pass it though at all


  (0, _util.assert)(['bitvec::order::Lsb0', 'bitvec::order::Msb0'].includes(bitOrder.namespace || ''), () => `Unexpected bitOrder found as ${bitOrder.namespace || '<unknown>'}`);
  (0, _util.assert)(bitStore.info === _index.TypeDefInfo.Plain && bitStore.type === 'u8', () => `Only u8 bitStore is currently supported, found ${bitStore.type}`);
  return {
    info: _index.TypeDefInfo.Plain,
    type: 'BitVec'
  };
}

function _extractCompact2(_, _ref17) {
  let {
    type
  } = _ref17;
  return (0, _encodeTypes.withTypeString)(this.registry, {
    info: _index.TypeDefInfo.Compact,
    sub: (0, _classPrivateFieldLooseBase2.default)(this, _createSiDef)[_createSiDef](type)
  });
}

function _extractComposite2(lookupIndex, _ref18, _ref19) {
  let {
    params,
    path
  } = _ref18;
  let {
    fields
  } = _ref19;
  const specialVariant = path[0].toString();

  if (path.length === 1 && specialVariant === 'BTreeMap') {
    return (0, _encodeTypes.withTypeString)(this.registry, {
      info: _index.TypeDefInfo.BTreeMap,
      sub: params.map(_ref20 => {
        let {
          type
        } = _ref20;
        return (0, _classPrivateFieldLooseBase2.default)(this, _createSiDef)[_createSiDef](type.unwrap());
      })
    });
  } else if (['Range', 'RangeInclusive'].includes(specialVariant)) {
    return (0, _encodeTypes.withTypeString)(this.registry, {
      info: _index.TypeDefInfo.Range,
      sub: fields.map((_ref21, index) => {
        let {
          name,
          type
        } = _ref21;
        return _objectSpread({
          name: name.isSome ? name.unwrap().toString() : ['start', 'end'][index]
        }, (0, _classPrivateFieldLooseBase2.default)(this, _createSiDef)[_createSiDef](type));
      })
    });
  }

  return SETS.some(p => matchParts(p, path)) ? (0, _classPrivateFieldLooseBase2.default)(this, _extractCompositeSet)[_extractCompositeSet](lookupIndex, params, fields) : (0, _classPrivateFieldLooseBase2.default)(this, _extractFields)[_extractFields](lookupIndex, fields);
}

function _extractCompositeSet2(_, params, fields) {
  (0, _util.assert)(params.length === 1 && fields.length === 1, 'Set handling expects param/field as single entries');
  return (0, _encodeTypes.withTypeString)(this.registry, {
    info: _index.TypeDefInfo.Set,
    length: this.registry.createType(this.registry.createLookupType(fields[0].type)).bitLength(),
    sub: this.getSiType(params[0].type.unwrap()).def.asVariant.variants.map(_ref22 => {
      let {
        index,
        name
      } = _ref22;
      return {
        // This will be an issue > 2^53 - 1 ... don't have those (yet)
        index: index.toNumber(),
        info: _index.TypeDefInfo.Plain,
        name: name.toString(),
        type: 'Null'
      };
    })
  });
}

function _extractFields2(lookupIndex, fields) {
  const [isStruct, isTuple] = fields.reduce((_ref23, _ref24) => {
    let [isAllNamed, isAllUnnamed] = _ref23;
    let {
      name
    } = _ref24;
    return [isAllNamed && name.isSome, isAllUnnamed && name.isNone];
  }, [true, true]);
  (0, _util.assert)(isTuple || isStruct, 'Invalid fields type detected, expected either Tuple (all unnamed) or Struct (all named)');

  if (fields.length === 0) {
    return {
      info: _index.TypeDefInfo.Null,
      type: 'Null'
    };
  } else if (isTuple && fields.length === 1) {
    const typeDef = (0, _classPrivateFieldLooseBase2.default)(this, _createSiDef)[_createSiDef](fields[0].type);

    return _objectSpread(_objectSpread({}, typeDef), lookupIndex === -1 ? {} : {
      lookupIndex,
      lookupName: (0, _classPrivateFieldLooseBase2.default)(this, _names)[_names][lookupIndex],
      lookupNameRoot: typeDef.lookupName
    });
  }

  const [sub, alias] = (0, _classPrivateFieldLooseBase2.default)(this, _extractFieldsAlias)[_extractFieldsAlias](fields);

  return (0, _encodeTypes.withTypeString)(this.registry, _objectSpread(_objectSpread(_objectSpread({
    info: isTuple // Tuple check first
    ? _index.TypeDefInfo.Tuple : _index.TypeDefInfo.Struct
  }, alias.size ? {
    alias
  } : {}), lookupIndex === -1 ? {} : {
    lookupIndex,
    lookupName: (0, _classPrivateFieldLooseBase2.default)(this, _names)[_names][lookupIndex]
  }), {}, {
    sub
  }));
}

function _extractFieldsAlias2(fields) {
  const alias = new Map();
  const sub = fields.map(_ref25 => {
    let {
      docs,
      name,
      type
    } = _ref25;

    const typeDef = (0, _classPrivateFieldLooseBase2.default)(this, _createSiDef)[_createSiDef](type);

    if (name.isNone) {
      return typeDef;
    }

    let nameField = (0, _util.stringCamelCase)(name.unwrap());
    let nameOrig = null;

    if (nameField.includes('#')) {
      nameOrig = nameField;
      nameField = nameOrig.replace(/#/g, '_');
    } else if (RESERVED.includes(nameField)) {
      nameOrig = nameField;
      nameField = `${nameField}_`;
    }

    if (nameOrig) {
      alias.set(nameField, nameOrig);
    }

    return _objectSpread(_objectSpread({}, typeDef), {}, {
      docs: docs.map(d => d.toString()),
      name: nameField
    });
  });
  return [sub, alias];
}

function _extractHistoric2(_, type) {
  return _objectSpread(_objectSpread({}, (0, _getTypeDef.getTypeDef)(type)), {}, {
    displayName: type.toString(),
    isFromSi: true
  });
}

function _extractPrimitive2(_, type) {
  const typeStr = type.def.asPrimitive.type.toString();
  return {
    info: _index.TypeDefInfo.Plain,
    type: PRIMITIVE_ALIAS[typeStr] || typeStr.toLowerCase()
  };
}

function _extractPrimitivePath2(_, type) {
  return {
    info: _index.TypeDefInfo.Plain,
    type
  };
}

function _extractSequence2(lookupIndex, _ref26) {
  let {
    type
  } = _ref26;

  const sub = (0, _classPrivateFieldLooseBase2.default)(this, _createSiDef)[_createSiDef](type);

  if (sub.type === 'u8') {
    return {
      info: _index.TypeDefInfo.Plain,
      type: 'Bytes'
    };
  }

  return (0, _encodeTypes.withTypeString)(this.registry, {
    info: _index.TypeDefInfo.Vec,
    lookupIndex,
    lookupName: (0, _classPrivateFieldLooseBase2.default)(this, _names)[_names][lookupIndex],
    sub
  });
}

function _extractTuple2(lookupIndex, ids) {
  if (ids.length === 0) {
    return {
      info: _index.TypeDefInfo.Null,
      type: 'Null'
    };
  } else if (ids.length === 1) {
    return this.getTypeDef(ids[0]);
  }

  const sub = ids.map(type => (0, _classPrivateFieldLooseBase2.default)(this, _createSiDef)[_createSiDef](type));
  return (0, _encodeTypes.withTypeString)(this.registry, {
    info: _index.TypeDefInfo.Tuple,
    lookupIndex,
    lookupName: (0, _classPrivateFieldLooseBase2.default)(this, _names)[_names][lookupIndex],
    sub
  });
}

function _extractVariant2(lookupIndex, _ref27, _ref28) {
  let {
    params,
    path
  } = _ref27;
  let {
    variants
  } = _ref28;
  const specialVariant = path[0].toString();

  if (specialVariant === 'Option') {
    return (0, _encodeTypes.withTypeString)(this.registry, {
      info: _index.TypeDefInfo.Option,
      sub: (0, _classPrivateFieldLooseBase2.default)(this, _createSiDef)[_createSiDef](params[0].type.unwrap())
    });
  } else if (specialVariant === 'Result') {
    return (0, _encodeTypes.withTypeString)(this.registry, {
      info: _index.TypeDefInfo.Result,
      sub: params.map((_ref29, index) => {
        let {
          type
        } = _ref29;
        return _objectSpread({
          name: ['Ok', 'Error'][index]
        }, (0, _classPrivateFieldLooseBase2.default)(this, _createSiDef)[_createSiDef](type.unwrap()));
      })
    });
  } else if (variants.length === 0) {
    return {
      info: _index.TypeDefInfo.Null,
      type: 'Null'
    };
  }

  return (0, _classPrivateFieldLooseBase2.default)(this, _extractVariantEnum)[_extractVariantEnum](lookupIndex, variants);
}

function _extractVariantEnum2(lookupIndex, variants) {
  const sub = []; // we may get entries out of order, arrange them first before creating with gaps filled
  // NOTE: Since we mutate, use a copy of the array as an input

  [...variants].sort((a, b) => a.index.cmp(b.index)).forEach(_ref30 => {
    let {
      fields,
      index,
      name
    } = _ref30;
    const desired = index.toNumber();

    while (sub.length !== desired) {
      sub.push({
        index: sub.length,
        info: _index.TypeDefInfo.Null,
        name: `Unused${sub.length}`,
        type: 'Null'
      });
    }

    sub.push(_objectSpread(_objectSpread({}, (0, _classPrivateFieldLooseBase2.default)(this, _extractFields)[_extractFields](-1, fields)), {}, {
      index: index.toNumber(),
      name: name.toString()
    }));
  });
  return (0, _encodeTypes.withTypeString)(this.registry, {
    info: _index.TypeDefInfo.Enum,
    lookupIndex,
    lookupName: (0, _classPrivateFieldLooseBase2.default)(this, _names)[_names][lookupIndex],
    sub
  });
}