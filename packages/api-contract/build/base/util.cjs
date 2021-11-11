"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EMPTY_SALT = void 0;
exports.createBluePrintTx = createBluePrintTx;
exports.createBluePrintWithId = createBluePrintWithId;
exports.encodeSalt = encodeSalt;

var _types = require("@axia-js/types");

var _util = require("@axia-js/util");

var _utilCrypto = require("@axia-js/util-crypto");

var _util2 = require("../util.cjs");

// Copyright 2017-2021 @axia-js/api-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0
const EMPTY_SALT = new Uint8Array();
exports.EMPTY_SALT = EMPTY_SALT;

function createBluePrintTx(fn) {
  return (options, ...params) => (0, _util2.isOptions)(options) ? fn(options, params) : fn(...(0, _util2.extractOptions)(options, params));
}

function createBluePrintWithId(fn) {
  return (constructorOrId, options, ...params) => (0, _util2.isOptions)(options) ? fn(constructorOrId, options, params) : fn(constructorOrId, ...(0, _util2.extractOptions)(options, params));
}

function encodeSalt(salt = (0, _utilCrypto.randomAsU8a)()) {
  return salt instanceof _types.Bytes ? salt : salt && salt.length ? (0, _util.compactAddLength)((0, _util.u8aToU8a)(salt)) : EMPTY_SALT;
}