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
        config,
      );

      data.collage_items = attributes.collage_items === "" ? "" : JSON.parse(
        this.decodeWysiwygCharacters(attributes.collage_items || ""),
      );

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
      if (typeof data.collage_items === "object") {
        data.collage_items = JSON.stringify(data.collage_items);
      }

      var attributes = {
        type: "Satoshi\\SatoshiUi\\Block\\Widget\\Collage",
        collage_items: this.encodeWysiwygCharacters(data.collage_items || ""),
      };

      (0, _object.set)(
        data,
        config.html_variable,
        this.buildDirective(attributes),
      );
      return data;
    };
    /**
     * @param {string} content
     * @returns {string}
     */

    _proto.encodeWysiwygCharacters = function encodeWysiwygCharacters(content) {
      return content
        .replace(/\{/g, "^[")
        .replace(/\}/g, "^]")
        .replace(/"/g, "`")
        .replace(/\\/g, "|")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    };
    /**
     * @param {string} content
     * @returns {string}
     */

    _proto.decodeWysiwygCharacters = function decodeWysiwygCharacters(content) {
      return content
        .replace(/\^\[/g, "{")
        .replace(/\^\]/g, "}")
        .replace(/`/g, '"')
        .replace(/\|/g, "\\")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
    };
    /**
     * Decode html special characters
     *
     * @param {string} content
     * @returns {string}
     */

    _proto.decodeHtmlCharacters = function decodeHtmlCharacters(content) {
      if (content) {
        var htmlDocument = new DOMParser().parseFromString(
          content,
          "text/html",
        );
        return htmlDocument.body ? htmlDocument.body.textContent : content;
      }

      return content;
    };

    return WidgetDirective;
  })(_widgetDirectiveAbstract);

  return WidgetDirective;
});
//# sourceMappingURL=widget-directive.js.map
