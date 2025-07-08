/*eslint-disable */
/* jscs:disable */
define(["Magento_PageBuilder/js/utils/object"], function (_object) {
  /**
   * @api
   */
  var Percentage = /*#__PURE__*/ (function () {
    "use strict";

    function Percentage() {}

    var _proto = Percentage.prototype;

    /**
     * Convert value to internal format
     *
     * @param value string
     * @returns {string | object}
     */
    _proto.fromDom = function fromDom(value) {
      return value === "" ? 0 : Number(+value * 100).toString();
    };
    /**
     * Convert value to knockout format
     *
     * @param name string
     * @param data Object
     * @returns {string | object}
     */

    _proto.toDom = function toDom(name, data) {
      var value = (0, _object.get)(data, name);
      return Number(+value / 100).toString();
    };

    return Percentage;
  })();

  return Percentage;
});
//# sourceMappingURL=percentage.js.map
