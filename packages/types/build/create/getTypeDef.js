import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { assert, isNumber, isString } from '@axia-js/util';
import { sanitize } from "./sanitize.js";
import { TypeDefInfo } from "./types.js";
import { typeSplit } from "./typeSplit.js";
const MAX_NESTED = 64;
const KNOWN_INTERNALS = ['_alias', '_fallback'];

function getTypeString(typeOrObj) {
  return isString(typeOrObj) ? typeOrObj.toString() : JSON.stringify(typeOrObj);
}

function isRustEnum(details) {
  const values = Object.values(details);

  if (values.some(v => isNumber(v))) {
    assert(values.every(v => isNumber(v) && v >= 0 && v <= 255), 'Invalid number-indexed enum definition');
    return false;
  }

  return true;
} // decode an enum of either of the following forms
//  { _enum: ['A', 'B', 'C'] }
//  { _enum: { A: AccountId, B: Balance, C: u32 } }
//  { _enum: { A: 1, B: 2 } }


function _decodeEnum(value, details, count) {
  value.info = TypeDefInfo.Enum; // not as pretty, but remain compatible with oo7 for both struct and Array types

  if (Array.isArray(details)) {
    value.sub = details.map((name, index) => ({
      index,
      info: TypeDefInfo.Plain,
      name,
      type: 'Null'
    }));
  } else if (isRustEnum(details)) {
    value.sub = Object.entries(details).map(([name, typeOrObj], index) => _objectSpread(_objectSpread({}, getTypeDef(getTypeString(typeOrObj || 'Null'), {
      name
    }, count)), {}, {
      index
    }));
  } else {
    value.sub = Object.entries(details).map(([name, index]) => ({
      index,
      info: TypeDefInfo.Plain,
      name,
      type: 'Null'
    }));
  }

  return value;
} // decode a set of the form
//   { _set: { A: 0b0001, B: 0b0010, C: 0b0100 } }


function _decodeSet(value, details) {
  value.info = TypeDefInfo.Set;
  value.length = details._bitLength;
  value.sub = Object.entries(details).filter(([name]) => !name.startsWith('_')).map(([name, index]) => ({
    index,
    info: TypeDefInfo.Plain,
    name,
    type: 'Null'
  }));
  return value;
} // decode a struct, set or enum
// eslint-disable-next-line @typescript-eslint/no-unused-vars


function _decodeStruct(value, type, _, count) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const parsed = JSON.parse(type);
  const keys = Object.keys(parsed);

  if (keys.length === 1 && keys[0] === '_enum') {
    return _decodeEnum(value, parsed[keys[0]], count);
  } else if (keys.length === 1 && keys[0] === '_set') {
    return _decodeSet(value, parsed[keys[0]]);
  }

  value.alias = parsed._alias ? new Map(Object.entries(parsed._alias)) : undefined;
  value.fallbackType = parsed._fallback;
  value.sub = keys.filter(name => !KNOWN_INTERNALS.includes(name)).map(name => getTypeDef(getTypeString(parsed[name]), {
    name
  }, count));
  return value;
} // decode a fixed vector, e.g. [u8;32]
// eslint-disable-next-line @typescript-eslint/no-unused-vars


function _decodeFixedVec(value, type, _, count) {
  const max = type.length - 1;
  let index = -1;
  let inner = 0;

  for (let i = 1; i < max && index === -1; i++) {
    if (type[i] === ';' && inner === 0) {
      index = i;
    } else if (['[', '(', '<'].includes(type[i])) {
      inner++;
    } else if ([']', ')', '>'].includes(type[i])) {
      inner--;
    }
  }

  assert(index !== -1, () => `${type}: Unable to extract location of ';'`);
  const vecType = type.substr(1, index - 1);
  const [strLength, displayName] = type.substr(index + 1, max - index - 1).split(';');
  const length = parseInt(strLength.trim(), 10); // as a first round, only u8 via u8aFixed, we can add more support

  assert(length <= 256, () => `${type}: Only support for [Type; <length>], where length <= 256`);
  value.displayName = displayName;
  value.length = length;
  value.sub = getTypeDef(vecType, {}, count);
  return value;
}

function _decodeRange(value, _, subType) {
  const Type = getTypeDef(subType);
  value.sub = [Type, Type];
  return value;
} // decode a tuple


function _decodeTuple(value, _, subType, count) {
  value.sub = subType.length === 0 ? [] : typeSplit(subType).map(inner => getTypeDef(inner, {}, count));
  return value;
} // decode a Int/UInt<bitLength[, name]>
// eslint-disable-next-line @typescript-eslint/no-unused-vars


function _decodeAnyInt(value, type, _, clazz) {
  const [strLength, displayName] = type.substr(clazz.length + 1, type.length - clazz.length - 1 - 1).split(',');
  const length = parseInt(strLength.trim(), 10); // as a first round, only u8 via u8aFixed, we can add more support

  assert(length <= 8192 && length % 8 === 0, () => `${type}: Only support for ${clazz}<bitLength>, where length <= 8192 and a power of 8, found ${length}`);
  value.displayName = displayName;
  value.length = length;
  return value;
}

function _decodeInt(value, type, subType) {
  return _decodeAnyInt(value, type, subType, 'Int');
}

function _decodeUInt(value, type, subType) {
  return _decodeAnyInt(value, type, subType, 'UInt');
} // eslint-disable-next-line @typescript-eslint/no-unused-vars


function _decodeDoNotConstruct(value, type, _) {
  const NAME_LENGTH = 'DoNotConstruct'.length;
  value.displayName = type.substr(NAME_LENGTH + 1, type.length - NAME_LENGTH - 1 - 1);
  return value;
}

function hasWrapper(type, [start, end]) {
  return type.substr(0, start.length) === start && type.substr(-1 * end.length) === end;
}

const nestedExtraction = [['[', ']', TypeDefInfo.VecFixed, _decodeFixedVec], ['{', '}', TypeDefInfo.Struct, _decodeStruct], ['(', ')', TypeDefInfo.Tuple, _decodeTuple], // the inner for these are the same as tuple, multiple values
['BTreeMap<', '>', TypeDefInfo.BTreeMap, _decodeTuple], ['HashMap<', '>', TypeDefInfo.HashMap, _decodeTuple], ['Int<', '>', TypeDefInfo.Int, _decodeInt], // Not sure about these, have a specific implementation?
['Range<', '>', TypeDefInfo.Tuple, _decodeRange], ['RangeInclusive<', '>', TypeDefInfo.Tuple, _decodeRange], ['Result<', '>', TypeDefInfo.Result, _decodeTuple], ['UInt<', '>', TypeDefInfo.UInt, _decodeUInt], ['DoNotConstruct<', '>', TypeDefInfo.DoNotConstruct, _decodeDoNotConstruct]];
const wrappedExtraction = [['BTreeSet<', '>', TypeDefInfo.BTreeSet], ['Compact<', '>', TypeDefInfo.Compact], ['Linkage<', '>', TypeDefInfo.Linkage], ['Option<', '>', TypeDefInfo.Option], ['Vec<', '>', TypeDefInfo.Vec]];

function extractSubType(type, [start, end]) {
  return type.substr(start.length, type.length - start.length - end.length);
} // eslint-disable-next-line @typescript-eslint/ban-types


export function getTypeDef(_type, {
  displayName,
  name
} = {}, count = 0) {
  // create the type via Type, allowing types to be sanitized
  const type = sanitize(_type);
  const value = {
    displayName,
    info: TypeDefInfo.Plain,
    name,
    type
  };
  assert(++count !== MAX_NESTED, 'getTypeDef: Maximum nested limit reached');
  const nested = nestedExtraction.find(nested => hasWrapper(type, nested));

  if (nested) {
    value.info = nested[2];
    return nested[3](value, type, extractSubType(type, nested), count);
  }

  const wrapped = wrappedExtraction.find(wrapped => hasWrapper(type, wrapped));

  if (wrapped) {
    value.info = wrapped[2];
    value.sub = getTypeDef(extractSubType(type, wrapped), {}, count);
  }

  return value;
}