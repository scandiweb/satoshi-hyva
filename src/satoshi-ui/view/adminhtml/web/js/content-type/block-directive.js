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

/**
 * Use block directive for:
 * - Template that doesn't use widget form
 * and uses another form (for example: page builder form)
 * because widget form and page builder form can sometimes be different
 * and to prevent using widget form while there is page builder form for configuring the template.
 * - Easier changing template because the block directive template isn't hard-coded to database,
 * while template on master.html is hard-coded to database. If the template isn't hard-coded to database,
 * after changing template, we don't need to re-save the template to database
 * by re-saving content type and re-saving CMS content on which the content type located on page builder.
 * (Reference:
 * - https://developer.adobe.com/commerce/frontend-core/page-builder/content-types/create/troubleshooting/#change-in-the-masterhtml-is-not-visible
 * - https://community.magento.com/t5/Magento-2-x-PWA-Theming-Layout/Updating-Page-Builder-Templates-already-saved-to-db/td-p/137959
 * )
 */
define([
  "Magento_PageBuilder/js/mass-converter/widget-directive-abstract",
  "Magento_PageBuilder/js/utils/object",
], function (_widgetDirectiveAbstract, _object) {
  /**
   * Copyright © Magento, Inc. All rights reserved.
   * See COPYING.txt for license details.
   */

  /**
   * Enables the settings of the content type to be stored as a block directive.
   *
   * @api
   */
  var BlockDirective = /*#__PURE__*/ (function (_widgetDirectiveAbstr) {
    "use strict";

    _inheritsLoose(BlockDirective, _widgetDirectiveAbstr);

    function BlockDirective() {
      return _widgetDirectiveAbstr.apply(this, arguments) || this;
    }

    var _proto = BlockDirective.prototype;

    /**
     * Overridden to use block directive instead of widget directive
     */
    _proto.buildDirective = function buildDirective(attributes) {
      return "{{block " + this.createAttributesString(attributes) + "}}";
    };

    /**
     * Convert value to internal format
     *
     * @param {object} data
     * @returns {object}
     */
    _proto.fromDom = function fromDom(data) {
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
        class: config.block_class,
        ...this.getAdditionalBlockAttributes(data),
      };

      (0, _object.set)(
        data,
        config.html_variable,
        this.buildDirective(attributes),
      );

      return data;
    };

    /**
     * To be overridden on child class
     */
    _proto.getAdditionalBlockAttributes =
      function getAdditionalBlockAttributes() {
        return {};
      };

    return BlockDirective;
  })(_widgetDirectiveAbstract);

  return BlockDirective;
});
//# sourceMappingURL=block-directive.js.map
