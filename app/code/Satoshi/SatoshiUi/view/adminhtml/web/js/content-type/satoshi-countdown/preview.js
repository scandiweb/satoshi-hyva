define(["Magento_PageBuilder/js/content-type/preview"], function (PreviewBase) {
  "use strict";
  var $super;

  function Preview(parent, config, stageId) {
    PreviewBase.call(this, parent, config, stageId);
    this.openQuestion = 1;
  }

  Preview.prototype = Object.create(PreviewBase.prototype);
  $super = PreviewBase.prototype;

  return Preview;
});
