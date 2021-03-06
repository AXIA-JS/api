import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import _classPrivateFieldLooseBase from "@babel/runtime/helpers/esm/classPrivateFieldLooseBase";
import _classPrivateFieldLooseKey from "@babel/runtime/helpers/esm/classPrivateFieldLooseKey";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { Struct } from "../codec/Struct.js";
import { Tuple } from "../codec/Tuple.js";
import { Null } from "../primitive/Null.js";

/** @internal */
function decodeEvent(registry, value) {
  if (!value || !value.length) {
    return {
      DataType: Null
    };
  }

  const index = value.subarray(0, 2);
  return {
    DataType: registry.findMetaEvent(index),
    value: {
      data: value.subarray(2),
      index
    }
  };
}
/**
 * @name GenericEventData
 * @description
 * Wrapper for the actual data that forms part of an [[Event]]
 */


var _meta = /*#__PURE__*/_classPrivateFieldLooseKey("meta");

var _method = /*#__PURE__*/_classPrivateFieldLooseKey("method");

var _section = /*#__PURE__*/_classPrivateFieldLooseKey("section");

var _typeDef = /*#__PURE__*/_classPrivateFieldLooseKey("typeDef");

export class GenericEventData extends Tuple {
  constructor(registry, value, meta, section = '<unknown>', method = '<unknown>') {
    const fields = (meta === null || meta === void 0 ? void 0 : meta.fields) || [];
    super(registry, fields.map(({
      type
    }) => registry.createLookupType(type)), value);
    Object.defineProperty(this, _meta, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _method, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _section, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _typeDef, {
      writable: true,
      value: void 0
    });
    _classPrivateFieldLooseBase(this, _meta)[_meta] = meta;
    _classPrivateFieldLooseBase(this, _method)[_method] = method;
    _classPrivateFieldLooseBase(this, _section)[_section] = section;
    _classPrivateFieldLooseBase(this, _typeDef)[_typeDef] = fields.map(({
      type
    }) => registry.lookup.getTypeDef(type));
  }
  /**
   * @description The wrapped [[EventMetadata]]
   */


  get meta() {
    return _classPrivateFieldLooseBase(this, _meta)[_meta];
  }
  /**
   * @description The method as a string
   */


  get method() {
    return _classPrivateFieldLooseBase(this, _method)[_method];
  }
  /**
   * @description The section as a string
   */


  get section() {
    return _classPrivateFieldLooseBase(this, _section)[_section];
  }
  /**
   * @description The [[TypeDef]] for this event
   */


  get typeDef() {
    return _classPrivateFieldLooseBase(this, _typeDef)[_typeDef];
  }

}
/**
 * @name GenericEvent
 * @description
 * A representation of a system event. These are generated via the [[Metadata]] interfaces and
 * specific to a specific Substrate runtime
 */

export class GenericEvent extends Struct {
  // Currently we _only_ decode from Uint8Array, since we expect it to
  // be used via EventRecord
  constructor(registry, _value) {
    const {
      DataType,
      value
    } = decodeEvent(registry, _value);
    super(registry, {
      index: 'EventId',
      // eslint-disable-next-line sort-keys
      data: DataType
    }, value);
  }
  /**
   * @description The wrapped [[EventData]]
   */


  get data() {
    return this.get('data');
  }
  /**
   * @description The [[EventId]], identifying the raw event
   */


  get index() {
    return this.get('index');
  }
  /**
   * @description The [[EventMetadata]] with the documentation
   */


  get meta() {
    return this.data.meta;
  }
  /**
   * @description The method string identifying the event
   */


  get method() {
    return this.data.method;
  }
  /**
   * @description The section string identifying the event
   */


  get section() {
    return this.data.section;
  }
  /**
   * @description The [[TypeDef]] for the event
   */


  get typeDef() {
    return this.data.typeDef;
  }
  /**
   * @description Converts the Object to to a human-friendly JSON, with additional fields, expansion and formatting of information
   */


  toHuman(isExpanded) {
    return _objectSpread(_objectSpread({
      method: this.method,
      section: this.section
    }, isExpanded ? {
      docs: this.meta.docs.map(d => d.toString())
    } : {}), super.toHuman(isExpanded));
  }

}