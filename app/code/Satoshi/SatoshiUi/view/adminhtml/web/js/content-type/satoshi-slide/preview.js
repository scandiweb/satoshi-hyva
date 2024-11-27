define([
  "Magento_PageBuilder/js/content-type/preview-collection",
  "Magento_PageBuilder/js/events",
  "underscore",
  "jquery",
  "Magento_PageBuilder/js/content-type-menu/option",
  "mage/translate",
  "Magento_PageBuilder/js/content-type-factory",
  "Magento_PageBuilder/js/config",
  "Magento_PageBuilder/js/events",
], function (
  PreviewBase,
  events,
  _underscore,
  $,
  _option,
  _translate,
  _contentTypeFactory,
  _config,
  _events
) {
  "use strict";
  var $super;

  function Preview(parent, config, stageId) {
    PreviewBase.call(this, parent, config, stageId);
  }

  Preview.prototype = Object.create(PreviewBase.prototype);
  $super = PreviewBase.prototype;

  /**
   * xx
   */

  Preview.prototype.xx = function xx() {};

  return Preview;
});
