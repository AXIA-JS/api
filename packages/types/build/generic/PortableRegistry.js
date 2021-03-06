import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import _classPrivateFieldLooseBase from "@babel/runtime/helpers/esm/classPrivateFieldLooseBase";
import _classPrivateFieldLooseKey from "@babel/runtime/helpers/esm/classPrivateFieldLooseKey";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { assert, isNumber, isString, stringCamelCase, stringify, stringUpperFirst } from '@axia-js/util';
import { Struct } from "../codec/Struct.js";
import { withTypeString } from "../create/encodeTypes.js";
import { getTypeDef } from "../create/getTypeDef.js";
import { TypeDefInfo } from "../types/index.js"; // Just a placeholder for a type.unrwapOr()

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
  return names.map(([lookupIndex, name, params]) => {
    if (!name) {
      return [lookupIndex, null];
    } // those where the name is matching


    const allSame = names.filter(([, oName]) => name === oName); // are there among matching names

    const anyDiff = allSame.some(([oIndex,, oParams]) => lookupIndex !== oIndex && (params.length !== oParams.length || params.some((p, index) => !p.name.eq(oParams[index].name) || p.type.unwrapOr(TYPE_UNWRAP).toNumber() !== oParams[index].type.unwrapOr(TYPE_UNWRAP).toNumber()))); // everything matches, we can combine these

    if (!anyDiff || !allSame[0][2].length) {
      return [lookupIndex, name];
    } // find the first parameter that yields differences


    const paramIdx = allSame[0][2].findIndex(({
      type
    }, index) => allSame.every(([,, params]) => params[index].type.isSome) && allSame.every(([,, params], aIndex) => aIndex === 0 || !params[index].type.eq(type))); // No param found that is different

    if (paramIdx === -1) {
      return [lookupIndex, name];
    } // see if using the param type helps


    const adjusted = allSame.map(([oIndex, oName, oParams]) => {
      const {
        def,
        path
      } = lookup.getSiType(oParams[paramIdx].type.unwrap());

      if (!def.isPrimitive && !path.length) {
        return [oIndex, null];
      }

      return [oIndex, def.isPrimitive ? `${oName}${def.asPrimitive.toString()}` : `${oName}${path[path.length - 1].toString()}`];
    }); // any dupes remaining?

    const noDupes = adjusted.every(([i, n]) => !!n && !adjusted.some(([ai, an]) => i !== ai && n === an));

    if (noDupes) {
      // we filtered above for null names
      adjusted.forEach(([index, name]) => {
        rewrite[index] = name;
      });
    }

    return noDupes ? [lookupIndex, name] : [lookupIndex, null];
  }).filter(n => !!n[1]).map(([lookupIndex, name]) => [lookupIndex, rewrite[lookupIndex] || name]);
}

function extractName(types, {
  id,
  type: {
    params,
    path
  }
}) {
  const lookupIndex = id.toNumber();

  if (!path.length || WRAPPERS.includes(path[path.length - 1].toString())) {
    return [lookupIndex, null, []];
  }

  const parts = path.map(p => stringUpperFirst(stringCamelCase(p))).filter((p, index) => ( // Remove ::{pallet, traits, types}::
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
  const [names, typesNew] = dedup.reduce(([names, types], [lookupIndex, name]) => {
    // We set the name for this specific type
    names[lookupIndex] = name; // we map to the actual lookupIndex

    types[name] = lookup.registry.createLookupType(lookupIndex);
    return [names, types];
  }, [{}, {}]);
  lookup.registry.register(typesNew);
  return names;
}

var _names = /*#__PURE__*/_classPrivateFieldLooseKey("names");

var _typeDefs = /*#__PURE__*/_classPrivateFieldLooseKey("typeDefs");

var _createSiDef = /*#__PURE__*/_classPrivateFieldLooseKey("createSiDef");

var _getLookupId = /*#__PURE__*/_classPrivateFieldLooseKey("getLookupId");

var _extract = /*#__PURE__*/_classPrivateFieldLooseKey("extract");

var _extractArray = /*#__PURE__*/_classPrivateFieldLooseKey("extractArray");

var _extractBitSequence = /*#__PURE__*/_classPrivateFieldLooseKey("extractBitSequence");

var _extractCompact = /*#__PURE__*/_classPrivateFieldLooseKey("extractCompact");

var _extractComposite = /*#__PURE__*/_classPrivateFieldLooseKey("extractComposite");

var _extractCompositeSet = /*#__PURE__*/_classPrivateFieldLooseKey("extractCompositeSet");

var _extractFields = /*#__PURE__*/_classPrivateFieldLooseKey("extractFields");

var _extractFieldsAlias = /*#__PURE__*/_classPrivateFieldLooseKey("extractFieldsAlias");

var _extractHistoric = /*#__PURE__*/_classPrivateFieldLooseKey("extractHistoric");

var _extractPrimitive = /*#__PURE__*/_classPrivateFieldLooseKey("extractPrimitive");

var _extractPrimitivePath = /*#__PURE__*/_classPrivateFieldLooseKey("extractPrimitivePath");

var _extractSequence = /*#__PURE__*/_classPrivateFieldLooseKey("extractSequence");

var _extractTuple = /*#__PURE__*/_classPrivateFieldLooseKey("extractTuple");

var _extractVariant = /*#__PURE__*/_classPrivateFieldLooseKey("extractVariant");

var _extractVariantEnum = /*#__PURE__*/_classPrivateFieldLooseKey("extractVariantEnum");

export class GenericPortableRegistry extends Struct {
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
    _classPrivateFieldLooseBase(this, _names)[_names] = extractNames(this, this.types);
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
    return _classPrivateFieldLooseBase(this, _names)[_names][_classPrivateFieldLooseBase(this, _getLookupId)[_getLookupId](lookupId)];
  }
  /**
   * @description Finds a specific type in the registry
   */


  getSiType(lookupId) {
    const found = this.types[_classPrivateFieldLooseBase(this, _getLookupId)[_getLookupId](lookupId)];

    assert(found, () => `PortableRegistry: Unable to find type with lookupId ${lookupId.toString()}`);
    return found.type;
  }
  /**
   * @description Lookup the type definition for the index
   */


  getTypeDef(lookupId) {
    const lookupIndex = _classPrivateFieldLooseBase(this, _getLookupId)[_getLookupId](lookupId);

    if (!_classPrivateFieldLooseBase(this, _typeDefs)[_typeDefs][lookupIndex]) {
      const lookupName = _classPrivateFieldLooseBase(this, _names)[_names][lookupIndex];

      const empty = {
        info: TypeDefInfo.DoNotConstruct,
        lookupIndex,
        lookupName,
        type: this.registry.createLookupType(lookupIndex)
      }; // Set named items since we will get into circular lookups along the way

      if (lookupName) {
        _classPrivateFieldLooseBase(this, _typeDefs)[_typeDefs][lookupIndex] = empty;
      }

      const extracted = _classPrivateFieldLooseBase(this, _extract)[_extract](this.getSiType(lookupId), lookupIndex); // For non-named items, we only set this right at the end


      if (!lookupName) {
        _classPrivateFieldLooseBase(this, _typeDefs)[_typeDefs][lookupIndex] = empty;
      }

      Object.keys(extracted).forEach(k => {
        if (k !== 'lookupName' || extracted[k]) {
          // these are safe since we are looking through the keys as set
          _classPrivateFieldLooseBase(this, _typeDefs)[_typeDefs][lookupIndex][k] = extracted[k];
        }
      }); // don't set lookupName on lower-level, we want to always direct to the type

      if (extracted.info === TypeDefInfo.Plain) {
        _classPrivateFieldLooseBase(this, _typeDefs)[_typeDefs][lookupIndex].lookupNameRoot = _classPrivateFieldLooseBase(this, _typeDefs)[_typeDefs][lookupIndex].lookupName;
        delete _classPrivateFieldLooseBase(this, _typeDefs)[_typeDefs][lookupIndex].lookupName;
      }
    }

    return _classPrivateFieldLooseBase(this, _typeDefs)[_typeDefs][lookupIndex];
  }

}

function _createSiDef2(lookupId) {
  const typeDef = this.getTypeDef(lookupId);
  const lookupIndex = lookupId.toNumber(); // Setup for a lookup on complex types

  return [TypeDefInfo.Enum, TypeDefInfo.Struct].includes(typeDef.info) && typeDef.lookupName ? {
    docs: typeDef.docs,
    info: TypeDefInfo.Si,
    lookupIndex,
    lookupName: _classPrivateFieldLooseBase(this, _names)[_names][lookupIndex],
    type: this.registry.createLookupType(lookupId)
  } : typeDef;
}

function _getLookupId2(lookupId) {
  if (isString(lookupId)) {
    assert(this.registry.isLookupType(lookupId), () => `PortableRegistry: Expected a lookup string type, found ${lookupId}`);
    return parseInt(lookupId.replace('Lookup', ''), 10);
  } else if (isNumber(lookupId)) {
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
      typeDef = _classPrivateFieldLooseBase(this, _extractPrimitivePath)[_extractPrimitivePath](lookupIndex, primType);
    } else if (type.def.isArray) {
      typeDef = _classPrivateFieldLooseBase(this, _extractArray)[_extractArray](lookupIndex, type.def.asArray);
    } else if (type.def.isBitSequence) {
      typeDef = _classPrivateFieldLooseBase(this, _extractBitSequence)[_extractBitSequence](lookupIndex, type.def.asBitSequence);
    } else if (type.def.isCompact) {
      typeDef = _classPrivateFieldLooseBase(this, _extractCompact)[_extractCompact](lookupIndex, type.def.asCompact);
    } else if (type.def.isComposite) {
      typeDef = _classPrivateFieldLooseBase(this, _extractComposite)[_extractComposite](lookupIndex, type, type.def.asComposite);
    } else if (type.def.isHistoricMetaCompat) {
      typeDef = _classPrivateFieldLooseBase(this, _extractHistoric)[_extractHistoric](lookupIndex, type.def.asHistoricMetaCompat);
    } else if (type.def.isPrimitive) {
      typeDef = _classPrivateFieldLooseBase(this, _extractPrimitive)[_extractPrimitive](lookupIndex, type);
    } else if (type.def.isSequence) {
      typeDef = _classPrivateFieldLooseBase(this, _extractSequence)[_extractSequence](lookupIndex, type.def.asSequence);
    } else if (type.def.isTuple) {
      typeDef = _classPrivateFieldLooseBase(this, _extractTuple)[_extractTuple](lookupIndex, type.def.asTuple);
    } else if (type.def.isVariant) {
      typeDef = _classPrivateFieldLooseBase(this, _extractVariant)[_extractVariant](lookupIndex, type, type.def.asVariant);
    } else {
      throw new Error(`No SiTypeDef handler for ${type.def.toString()}`);
    }
  } catch (error) {
    throw new Error(`PortableRegistry: ${lookupIndex}${namespace ? ` (${namespace})` : ''}: Error extracting ${stringify(type)}: ${error.message}`);
  }

  return _objectSpread({
    docs: type.docs.map(d => d.toString()),
    namespace
  }, typeDef);
}

function _extractArray2(_, {
  len: length,
  type
}) {
  assert(!length || length.toNumber() <= 256, 'Only support for [Type; <length>], where length <= 256');
  return withTypeString(this.registry, {
    info: TypeDefInfo.VecFixed,
    length: length.toNumber(),
    sub: _classPrivateFieldLooseBase(this, _createSiDef)[_createSiDef](type)
  });
}

function _extractBitSequence2(_, {
  bitOrderType,
  bitStoreType
}) {
  const bitOrder = _classPrivateFieldLooseBase(this, _createSiDef)[_createSiDef](bitOrderType);

  const bitStore = _classPrivateFieldLooseBase(this, _createSiDef)[_createSiDef](bitStoreType); // NOTE: Currently the BitVec type is one-way only, i.e. we only use it to decode, not
  // re-encode stuff. As such we ignore the msb/lsb identifier given by bitOrderType, or rather
  // we don't pass it though at all


  assert(['bitvec::order::Lsb0', 'bitvec::order::Msb0'].includes(bitOrder.namespace || ''), () => `Unexpected bitOrder found as ${bitOrder.namespace || '<unknown>'}`);
  assert(bitStore.info === TypeDefInfo.Plain && bitStore.type === 'u8', () => `Only u8 bitStore is currently supported, found ${bitStore.type}`);
  return {
    info: TypeDefInfo.Plain,
    type: 'BitVec'
  };
}

function _extractCompact2(_, {
  type
}) {
  return withTypeString(this.registry, {
    info: TypeDefInfo.Compact,
    sub: _classPrivateFieldLooseBase(this, _createSiDef)[_createSiDef](type)
  });
}

function _extractComposite2(lookupIndex, {
  params,
  path
}, {
  fields
}) {
  const specialVariant = path[0].toString();

  if (path.length === 1 && specialVariant === 'BTreeMap') {
    return withTypeString(this.registry, {
      info: TypeDefInfo.BTreeMap,
      sub: params.map(({
        type
      }) => _classPrivateFieldLooseBase(this, _createSiDef)[_createSiDef](type.unwrap()))
    });
  } else if (['Range', 'RangeInclusive'].includes(specialVariant)) {
    return withTypeString(this.registry, {
      info: TypeDefInfo.Range,
      sub: fields.map(({
        name,
        type
      }, index) => _objectSpread({
        name: name.isSome ? name.unwrap().toString() : ['start', 'end'][index]
      }, _classPrivateFieldLooseBase(this, _createSiDef)[_createSiDef](type)))
    });
  }

  return SETS.some(p => matchParts(p, path)) ? _classPrivateFieldLooseBase(this, _extractCompositeSet)[_extractCompositeSet](lookupIndex, params, fields) : _classPrivateFieldLooseBase(this, _extractFields)[_extractFields](lookupIndex, fields);
}

function _extractCompositeSet2(_, params, fields) {
  assert(params.length === 1 && fields.length === 1, 'Set handling expects param/field as single entries');
  return withTypeString(this.registry, {
    info: TypeDefInfo.Set,
    length: this.registry.createType(this.registry.createLookupType(fields[0].type)).bitLength(),
    sub: this.getSiType(params[0].type.unwrap()).def.asVariant.variants.map(({
      index,
      name
    }) => ({
      // This will be an issue > 2^53 - 1 ... don't have those (yet)
      index: index.toNumber(),
      info: TypeDefInfo.Plain,
      name: name.toString(),
      type: 'Null'
    }))
  });
}

function _extractFields2(lookupIndex, fields) {
  const [isStruct, isTuple] = fields.reduce(([isAllNamed, isAllUnnamed], {
    name
  }) => [isAllNamed && name.isSome, isAllUnnamed && name.isNone], [true, true]);
  assert(isTuple || isStruct, 'Invalid fields type detected, expected either Tuple (all unnamed) or Struct (all named)');

  if (fields.length === 0) {
    return {
      info: TypeDefInfo.Null,
      type: 'Null'
    };
  } else if (isTuple && fields.length === 1) {
    const typeDef = _classPrivateFieldLooseBase(this, _createSiDef)[_createSiDef](fields[0].type);

    return _objectSpread(_objectSpread({}, typeDef), lookupIndex === -1 ? {} : {
      lookupIndex,
      lookupName: _classPrivateFieldLooseBase(this, _names)[_names][lookupIndex],
      lookupNameRoot: typeDef.lookupName
    });
  }

  const [sub, alias] = _classPrivateFieldLooseBase(this, _extractFieldsAlias)[_extractFieldsAlias](fields);

  return withTypeString(this.registry, _objectSpread(_objectSpread(_objectSpread({
    info: isTuple // Tuple check first
    ? TypeDefInfo.Tuple : TypeDefInfo.Struct
  }, alias.size ? {
    alias
  } : {}), lookupIndex === -1 ? {} : {
    lookupIndex,
    lookupName: _classPrivateFieldLooseBase(this, _names)[_names][lookupIndex]
  }), {}, {
    sub
  }));
}

function _extractFieldsAlias2(fields) {
  const alias = new Map();
  const sub = fields.map(({
    docs,
    name,
    type
  }) => {
    const typeDef = _classPrivateFieldLooseBase(this, _createSiDef)[_createSiDef](type);

    if (name.isNone) {
      return typeDef;
    }

    let nameField = stringCamelCase(name.unwrap());
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
  return _objectSpread(_objectSpread({}, getTypeDef(type)), {}, {
    displayName: type.toString(),
    isFromSi: true
  });
}

function _extractPrimitive2(_, type) {
  const typeStr = type.def.asPrimitive.type.toString();
  return {
    info: TypeDefInfo.Plain,
    type: PRIMITIVE_ALIAS[typeStr] || typeStr.toLowerCase()
  };
}

function _extractPrimitivePath2(_, type) {
  return {
    info: TypeDefInfo.Plain,
    type
  };
}

function _extractSequence2(lookupIndex, {
  type
}) {
  const sub = _classPrivateFieldLooseBase(this, _createSiDef)[_createSiDef](type);

  if (sub.type === 'u8') {
    return {
      info: TypeDefInfo.Plain,
      type: 'Bytes'
    };
  }

  return withTypeString(this.registry, {
    info: TypeDefInfo.Vec,
    lookupIndex,
    lookupName: _classPrivateFieldLooseBase(this, _names)[_names][lookupIndex],
    sub
  });
}

function _extractTuple2(lookupIndex, ids) {
  if (ids.length === 0) {
    return {
      info: TypeDefInfo.Null,
      type: 'Null'
    };
  } else if (ids.length === 1) {
    return this.getTypeDef(ids[0]);
  }

  const sub = ids.map(type => _classPrivateFieldLooseBase(this, _createSiDef)[_createSiDef](type));
  return withTypeString(this.registry, {
    info: TypeDefInfo.Tuple,
    lookupIndex,
    lookupName: _classPrivateFieldLooseBase(this, _names)[_names][lookupIndex],
    sub
  });
}

function _extractVariant2(lookupIndex, {
  params,
  path
}, {
  variants
}) {
  const specialVariant = path[0].toString();

  if (specialVariant === 'Option') {
    return withTypeString(this.registry, {
      info: TypeDefInfo.Option,
      sub: _classPrivateFieldLooseBase(this, _createSiDef)[_createSiDef](params[0].type.unwrap())
    });
  } else if (specialVariant === 'Result') {
    return withTypeString(this.registry, {
      info: TypeDefInfo.Result,
      sub: params.map(({
        type
      }, index) => _objectSpread({
        name: ['Ok', 'Error'][index]
      }, _classPrivateFieldLooseBase(this, _createSiDef)[_createSiDef](type.unwrap())))
    });
  } else if (variants.length === 0) {
    return {
      info: TypeDefInfo.Null,
      type: 'Null'
    };
  }

  return _classPrivateFieldLooseBase(this, _extractVariantEnum)[_extractVariantEnum](lookupIndex, variants);
}

function _extractVariantEnum2(lookupIndex, variants) {
  const sub = []; // we may get entries out of order, arrange them first before creating with gaps filled
  // NOTE: Since we mutate, use a copy of the array as an input

  [...variants].sort((a, b) => a.index.cmp(b.index)).forEach(({
    fields,
    index,
    name
  }) => {
    const desired = index.toNumber();

    while (sub.length !== desired) {
      sub.push({
        index: sub.length,
        info: TypeDefInfo.Null,
        name: `Unused${sub.length}`,
        type: 'Null'
      });
    }

    sub.push(_objectSpread(_objectSpread({}, _classPrivateFieldLooseBase(this, _extractFields)[_extractFields](-1, fields)), {}, {
      index: index.toNumber(),
      name: name.toString()
    }));
  });
  return withTypeString(this.registry, {
    info: TypeDefInfo.Enum,
    lookupIndex,
    lookupName: _classPrivateFieldLooseBase(this, _names)[_names][lookupIndex],
    sub
  });
}