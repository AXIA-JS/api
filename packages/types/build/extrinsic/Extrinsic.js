import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { assert, compactAddLength, compactFromU8a, isHex, isU8a, u8aConcat, u8aToHex, u8aToU8a } from '@axia-js/util';
import { Base } from "../codec/Base.js";
import { BIT_SIGNED, BIT_UNSIGNED, DEFAULT_VERSION, UNMASK_VERSION } from "./constants.js";
const VERSIONS = ['ExtrinsicUnknown', // v0 is unknown
'ExtrinsicUnknown', 'ExtrinsicUnknown', 'ExtrinsicUnknown', 'ExtrinsicV4'];
export { EXTRINSIC_VERSION as LATEST_EXTRINSIC_VERSION } from "./v4/Extrinsic.js";

class ExtrinsicBase extends Base {
  /**
   * @description The arguments passed to for the call, exposes args so it is compatible with [[Call]]
   */
  get args() {
    return this.method.args;
  }
  /**
   * @description The argument definitions, compatible with [[Call]]
   */


  get argsDef() {
    return this.method.argsDef;
  }
  /**
   * @description The actual `[sectionIndex, methodIndex]` as used in the Call
   */


  get callIndex() {
    return this.method.callIndex;
  }
  /**
   * @description The actual data for the Call
   */


  get data() {
    return this.method.data;
  }
  /**
   * @description The era for this extrinsic
   */


  get era() {
    return this._raw.signature.era;
  }
  /**
   * @description The length of the value when encoded as a Uint8Array
   */


  get encodedLength() {
    return this.toU8a().length;
  }
  /**
   * @description `true` id the extrinsic is signed
   */


  get isSigned() {
    return this._raw.signature.isSigned;
  }
  /**
   * @description The length of the actual data, excluding prefix
   */


  get length() {
    return this.toU8a(true).length;
  }
  /**
   * @description The [[FunctionMetadataLatest]] that describes the extrinsic
   */


  get meta() {
    return this.method.meta;
  }
  /**
   * @description The [[Call]] this extrinsic wraps
   */


  get method() {
    return this._raw.method;
  }
  /**
   * @description The nonce for this extrinsic
   */


  get nonce() {
    return this._raw.signature.nonce;
  }
  /**
   * @description The actual [[EcdsaSignature]], [[Ed25519Signature]] or [[Sr25519Signature]]
   */


  get signature() {
    return this._raw.signature.signature;
  }
  /**
   * @description The [[Address]] that signed
   */


  get signer() {
    return this._raw.signature.signer;
  }
  /**
   * @description Forwards compat
   */


  get tip() {
    return this._raw.signature.tip;
  }
  /**
   * @description Returns the raw transaction version (not flagged with signing information)
  */


  get type() {
    return this._raw.version;
  }
  /**
   * @description Returns the encoded version flag
  */


  get version() {
    return this.type | (this.isSigned ? BIT_SIGNED : BIT_UNSIGNED);
  }
  /**
   * @description Checks if the source matches this in type
   */


  is(other) {
    return this.method.is(other);
  }

}
/**
 * @name GenericExtrinsic
 * @description
 * Representation of an Extrinsic in the system. It contains the actual call,
 * (optional) signature and encodes with an actual length prefix
 *
 * {@link https://github.com/axia-tech/wiki/blob/master/Extrinsic.md#the-extrinsic-format-for-node}.
 *
 * Can be:
 * - signed, to create a transaction
 * - left as is, to create an inherent
 */


export class GenericExtrinsic extends ExtrinsicBase {
  constructor(registry, value, {
    version
  } = {}) {
    super(registry, GenericExtrinsic._decodeExtrinsic(registry, value, version));
  }
  /** @internal */


  static _newFromValue(registry, value, version) {
    if (value instanceof GenericExtrinsic) {
      return value._raw;
    }

    const isSigned = (version & BIT_SIGNED) === BIT_SIGNED;
    const type = VERSIONS[version & UNMASK_VERSION] || VERSIONS[0]; // we cast here since the VERSION definition is incredibly broad - we don't have a
    // slice for "only add extrinsic types", and more string definitions become unwieldy

    return registry.createType(type, value, {
      isSigned,
      version
    });
  }
  /** @internal */


  static _decodeExtrinsic(registry, value, version = DEFAULT_VERSION) {
    if (isU8a(value) || Array.isArray(value) || isHex(value)) {
      return GenericExtrinsic._decodeU8a(registry, u8aToU8a(value), version);
    } else if (value instanceof registry.createClass('Call')) {
      return GenericExtrinsic._newFromValue(registry, {
        method: value
      }, version);
    }

    return GenericExtrinsic._newFromValue(registry, value, version);
  }
  /** @internal */


  static _decodeU8a(registry, value, version) {
    if (!value.length) {
      return GenericExtrinsic._newFromValue(registry, new Uint8Array(), version);
    }

    const [offset, length] = compactFromU8a(value);
    const total = offset + length.toNumber();
    assert(total <= value.length, () => `Extrinsic: length less than remainder, expected at least ${total}, found ${value.length}`);
    const data = value.subarray(offset, total);
    return GenericExtrinsic._newFromValue(registry, data.subarray(1), data[0]);
  }
  /**
   * @description Injects an already-generated signature into the extrinsic
   */


  addSignature(signer, signature, payload) {
    this._raw.addSignature(signer, signature, payload);

    return this;
  }
  /**
   * @description Sign the extrinsic with a specific keypair
   */


  sign(account, options) {
    this._raw.sign(account, options);

    return this;
  }
  /**
   * @describe Adds a fake signature to the extrinsic
   */


  signFake(signer, options) {
    this._raw.signFake(signer, options);

    return this;
  }
  /**
   * @description Returns a hex string representation of the value
   */


  toHex(isBare) {
    return u8aToHex(this.toU8a(isBare));
  }
  /**
   * @description Converts the Object to to a human-friendly JSON, with additional fields, expansion and formatting of information
   */


  toHuman(isExpanded) {
    return _objectSpread({
      isSigned: this.isSigned,
      method: this.method.toHuman(isExpanded)
    }, this.isSigned ? {
      era: this.era.toHuman(isExpanded),
      nonce: this.nonce.toHuman(isExpanded),
      signature: this.signature.toHex(),
      signer: this.signer.toHuman(isExpanded),
      tip: this.tip.toHuman(isExpanded)
    } : {});
  }
  /**
   * @description Converts the Object to JSON, typically used for RPC transfers
   */


  toJSON() {
    return this.toHex();
  }
  /**
   * @description Returns the base runtime type name for this instance
   */


  toRawType() {
    return 'Extrinsic';
  }
  /**
   * @description Encodes the value as a Uint8Array as per the SCALE specifications
   * @param isBare true when the value is not length-prefixed
   */


  toU8a(isBare) {
    // we do not apply bare to the internal values, rather this only determines out length addition,
    // where we strip all lengths this creates an extrinsic that cannot be decoded
    const encoded = u8aConcat(new Uint8Array([this.version]), this._raw.toU8a());
    return isBare ? encoded : compactAddLength(encoded);
  }

}