"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Type = void 0;

var _sanitize = require("../create/sanitize.cjs");

var _Text = require("./Text.cjs");

// Copyright 2017-2021 @axia-js/types authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @name Type
 * @description
 * This is a extended version of Text, specifically to handle types. Here we rely fully
 * on what Text provides us, however we also adjust the types received from the runtime,
 * i.e. we remove the `T::` prefixes found in some types for consistency across implementation.
 */
class Type extends _Text.Text {
  constructor(registry) {
    let value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    super(registry, value);
    this.setOverride((0, _sanitize.sanitize)(this.toString()));
  }
  /**
   * @description Returns the base runtime type name for this instance
   */


  toRawType() {
    return 'Type';
  }

}

exports.Type = Type;