/*eslint-disable */
/* jscs:disable */

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf =
    Object.setPrototypeOf ||
    function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
  return _setPrototypeOf(o, p);
}

define([
  "Magento_PageBuilder/js/mass-converter/widget-directive-abstract",
  "Magento_PageBuilder/js/utils/object",
], function (_widgetDirectiveAbstract, _object) {
  /**
   * @api
   */
  var WidgetDirective = /*#__PURE__*/ (function (_widgetDirectiveAbstr) {
    "use strict";

    _inheritsLoose(WidgetDirective, _widgetDirectiveAbstr);

    function WidgetDirective() {
      return _widgetDirectiveAbstr.apply(this, arguments) || this;
    }

    var _proto = WidgetDirective.prototype;

    /**
     * Convert value to internal format
     *
     * @param {object} data
     * @param {object} config
     * @returns {object}
     */
    _proto.fromDom = function fromDom(data, config) {
      var attributes = _widgetDirectiveAbstr.prototype.fromDom.call(
        this,
        data,
        config
      );

      data.product_id = attributes.product_id;

      return data;
    };

    /**
     * Convert value to knockout format
     *
     * @param {object} data
     * @param {object} config
     * @returns {object}
     */

    _proto.toDom = function toDom(data, config) {
      var attributes = {
        type: "Satoshi\\SatoshiUi\\Block\\Widget\\FeaturedProduct",
        product_id: data.product_id,
      };

      (0, _object.set)(
        data,
        config.html_variable,
        this.buildDirective(attributes)
      );
      return data;
    };

    return WidgetDirective;
  })(_widgetDirectiveAbstract);

  return WidgetDirective;
});
//# sourceMappingURL=widget-directive.js.map
