// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { CodecHash, Hash } from '../interfaces/runtime';
import type { AnyU8a, Codec, Registry } from '../types';

import { assert, compactAddLength, compactFromU8a, hexToU8a, isHex, isString, stringToU8a, u8aToHex, u8aToString } from '@axia-js/util';

import { Raw } from '../codec/Raw';

const MAX_LENGTH = 128 * 1024;

/** @internal */
function decodeText (value?: null | Text | string | AnyU8a | { toString: () => string }): string {
  if (isHex(value)) {
    return u8aToString(hexToU8a(value));
  } else if (value instanceof Uint8Array) {
    if (!value.length) {
      return '';
    }

    // for Raw, the internal buffer does not have an internal length
    // (the same applies in e.g. Bytes, where length is added at encoding-time)
    if (value instanceof Raw) {
      return u8aToString(value);
    }

    const [offset, length] = compactFromU8a(value);
    const total = offset + length.toNumber();

    assert(length.lten(MAX_LENGTH), () => `Text: length ${length.toString()} exceeds ${MAX_LENGTH}`);
    assert(total <= value.length, () => `Text: required length less than remainder, expected at least ${total}, found ${value.length}`);

    return u8aToString(value.subarray(offset, total));
  }

  return value ? value.toString() : '';
}

/**
 * @name Text
 * @description
 * This is a string wrapper, along with the length. It is used both for strings as well
 * as items such as documentation. It simply extends the standard JS `String` built-in
 * object, inheriting all methods exposed from `String`.
 * @noInheritDoc
 */
// TODO
//   - Strings should probably be trimmed (docs do come through with extra padding)
export class Text extends String implements Codec {
  public readonly registry: Registry;

  public createdAtHash?: Hash;

  #override: string | null = null;

  constructor (registry: Registry, value?: null | Text | string | AnyU8a | { toString: () => string }) {
    super(decodeText(value));

    this.registry = registry;
  }

  /**
   * @description The length of the value when encoded as a Uint8Array
   */
  public get encodedLength (): number {
    return this.toU8a().length;
  }

  /**
   * @description returns a hash of the contents
   */
  public get hash (): CodecHash {
    return this.registry.hash(this.toU8a());
  }

  /**
   * @description Checks if the value is an empty value
   */
  public get isEmpty (): boolean {
    return this.length === 0;
  }

  /**
   * @description The length of the value
   */
  public override get length (): number {
    // only included here since we ignore inherited docs
    return super.length;
  }

  /**
   * @description Compares the value of the input to see if there is a match
   */
  public eq (other?: unknown): boolean {
    return isString(other)
      ? this.toString() === other.toString()
      : false;
  }

  /**
   * @description Set an override value for this
   */
  public setOverride (override: string): void {
    this.#override = override;
  }

  /**
   * @description Returns a hex string representation of the value
   */
  public toHex (): string {
    // like with Vec<u8>, when we are encoding to hex, we don't actually add
    // the length prefix (it is already implied by the actual string length)
    return u8aToHex(this.toU8a(true));
  }

  /**
   * @description Converts the Object to to a human-friendly JSON, with additional fields, expansion and formatting of information
   */
  public toHuman (): string {
    return this.toJSON();
  }

  /**
   * @description Converts the Object to JSON, typically used for RPC transfers
   */
  public toJSON (): string {
    return this.toString();
  }

  /**
   * @description Returns the base runtime type name for this instance
   */
  public toRawType (): string {
    return 'Text';
  }

  /**
   * @description Returns the string representation of the value
   */
  public override toString (): string {
    return this.#override || super.toString();
  }

  /**
   * @description Encodes the value as a Uint8Array as per the SCALE specifications
   * @param isBare true when the value has none of the type-specific prefixes (internal)
   */
  public toU8a (isBare?: boolean): Uint8Array {
    // NOTE Here we use the super toString (we are not taking overrides into account,
    // rather encoding the original value the string was constructed with)
    const encoded = stringToU8a(super.toString());

    return isBare
      ? encoded
      : compactAddLength(encoded);
  }
}
