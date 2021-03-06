"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.referendums = referendums;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _rxjs = require("rxjs");

var _index = require("../util/index.cjs");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function referendums(instanceId, api) {
  return (0, _index.memo)(instanceId, () => api.derive.democracy.referendumsActive().pipe((0, _rxjs.switchMap)(referendums => referendums.length ? (0, _rxjs.combineLatest)([(0, _rxjs.of)(referendums), api.derive.democracy._referendumsVotes(referendums)]) : (0, _rxjs.of)([[], []])), (0, _rxjs.map)(_ref => {
    let [referendums, votes] = _ref;
    return referendums.map((referendum, index) => _objectSpread(_objectSpread({}, referendum), votes[index]));
  })));
}