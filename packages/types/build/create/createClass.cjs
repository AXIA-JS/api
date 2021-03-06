"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createClass = createClass;
exports.getTypeClass = getTypeClass;

var _util = require("@axia-js/util");

var _index = require("../codec/index.cjs");

var _index2 = require("../primitive/index.cjs");

var _getTypeDef = require("./getTypeDef.cjs");

var _types = require("./types.cjs");

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
function getSubDefArray(value) {
  (0, _util.assert)(value.sub && Array.isArray(value.sub), () => `Expected subtype as TypeDef[] in ${(0, _util.stringify)(value)}`);
  return value.sub;
}

function getSubDef(value) {
  (0, _util.assert)(value.sub && !Array.isArray(value.sub), () => `Expected subtype as TypeDef in ${(0, _util.stringify)(value)}`);
  return value.sub;
}

function getSubType(value) {
  return getSubDef(value).type;
} // create a maps of type string constructors from the input


function getTypeClassMap(value) {
  const result = {};
  return getSubDefArray(value).reduce((result, sub) => {
    result[sub.name] = sub.type;
    return result;
  }, result);
} // create an array of type string constructors from the input


function getTypeClassArray(value) {
  return getSubDefArray(value).map(_ref => {
    let {
      type
    } = _ref;
    return type;
  });
}

function createInt(_ref2, Clazz) {
  let {
    displayName,
    length
  } = _ref2;
  (0, _util.assert)((0, _util.isNumber)(length), () => `Expected bitLength information for ${displayName || Clazz.constructor.name}<bitLength>`);
  return Clazz.with(length, displayName);
}

function createHashMap(value, Clazz) {
  const [keyType, valueType] = getTypeClassArray(value);
  return Clazz.with(keyType, valueType);
}

const infoMapping = {
  [_types.TypeDefInfo.BTreeMap]: (registry, value) => createHashMap(value, _index.BTreeMap),
  [_types.TypeDefInfo.BTreeSet]: (registry, value) => _index.BTreeSet.with(getSubType(value)),
  [_types.TypeDefInfo.Compact]: (registry, value) => _index.Compact.with(getSubType(value)),
  [_types.TypeDefInfo.DoNotConstruct]: (registry, value) => _index.DoNotConstruct.with(value.displayName || value.type),
  [_types.TypeDefInfo.Enum]: (registry, value) => {
    const subs = getSubDefArray(value);
    return _index.Enum.with(subs.every(_ref3 => {
      let {
        type
      } = _ref3;
      return type === 'Null';
    }) ? subs.reduce((out, _ref4, count) => {
      let {
        index,
        name
      } = _ref4;
      out[name] = index || count;
      return out;
    }, {}) : getTypeClassMap(value));
  },
  [_types.TypeDefInfo.HashMap]: (registry, value) => createHashMap(value, _index.HashMap),
  [_types.TypeDefInfo.Int]: (registry, value) => createInt(value, _index.Int),
  // We have circular deps between Linkage & Struct
  [_types.TypeDefInfo.Linkage]: (registry, value) => {
    const type = `Option<${getSubType(value)}>`; // eslint-disable-next-line sort-keys

    const Clazz = _index.Struct.with({
      previous: type,
      next: type
    }); // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access


    Clazz.prototype.toRawType = function () {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      return `Linkage<${this.next.toRawType(true)}>`;
    };

    return Clazz;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [_types.TypeDefInfo.Null]: (registry, _) => _index2.Null,
  [_types.TypeDefInfo.Option]: (registry, value) => _index.Option.with(getSubType(value)),
  [_types.TypeDefInfo.Plain]: (registry, value) => registry.getOrUnknown(value.type),
  [_types.TypeDefInfo.Range]: (registry, value) => (value.type.includes('RangeInclusive') ? _index.RangeInclusive : _index.Range).with(getSubType(value)),
  [_types.TypeDefInfo.Result]: (registry, value) => {
    const [Ok, Err] = getTypeClassArray(value); // eslint-disable-next-line @typescript-eslint/no-use-before-define

    return _index.Result.with({
      Err,
      Ok
    });
  },
  [_types.TypeDefInfo.Set]: (registry, value) => {
    const result = {};
    return _index.CodecSet.with(getSubDefArray(value).reduce((result, _ref5) => {
      let {
        index,
        name
      } = _ref5;
      result[name] = index;
      return result;
    }, result), value.length);
  },
  [_types.TypeDefInfo.Si]: (registry, value) => getTypeClass(registry, registry.lookup.getTypeDef(value.type)),
  [_types.TypeDefInfo.Struct]: (registry, value) => _index.Struct.with(getTypeClassMap(value), value.alias),
  [_types.TypeDefInfo.Tuple]: (registry, value) => _index.Tuple.with(getTypeClassArray(value)),
  [_types.TypeDefInfo.UInt]: (registry, value) => createInt(value, _index.UInt),
  [_types.TypeDefInfo.Vec]: (registry, value) => {
    const subType = getSubType(value);
    return subType === 'u8' ? _index2.Bytes : _index.Vec.with(subType);
  },
  [_types.TypeDefInfo.VecFixed]: (registry, _ref6) => {
    let {
      displayName,
      length,
      sub
    } = _ref6;
    (0, _util.assert)((0, _util.isNumber)(length) && !(0, _util.isUndefined)(sub), 'Expected length & type information for fixed vector');
    const subType = sub.type;
    return subType === 'u8' ? _index.U8aFixed.with(length * 8, displayName) : _index.VecFixed.with(subType, length);
  }
}; // Returns the type Class for construction

function getTypeClass(registry, typeDef) {
  let Type = registry.get(typeDef.type);

  if (Type) {
    return Type;
  }

  try {
    Type = infoMapping[typeDef.info](registry, typeDef);
    (0, _util.assert)(Type, 'No class created'); // don't clobber any existing

    if (!Type.__fallbackType && typeDef.fallbackType) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore ...this is the only place we we actually assign this...
      Type.__fallbackType = typeDef.fallbackType;
    }

    return Type;
  } catch (error) {
    throw new Error(`Unable to construct class from ${(0, _util.stringify)(typeDef)}: ${error.message}`);
  }
}

function createClass(registry, type) {
  return getTypeClass(registry, registry.isLookupType(type) ? registry.lookup.getTypeDef(type) : (0, _getTypeDef.getTypeDef)(type));
}