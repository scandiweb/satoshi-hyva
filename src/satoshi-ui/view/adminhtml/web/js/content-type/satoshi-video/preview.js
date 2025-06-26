define(["Magento_PageBuilder/js/content-type/preview"], function (PreviewBase) {
  "use strict";
  var $super;

  function Preview(parent, config, stageId) {
    PreviewBase.call(this, parent, config, stageId);
  }

  Preview.prototype = Object.create(PreviewBase.prototype);
  $super = PreviewBase.prototype;

  Preview.prototype.handleClick = function handleClick(preview, event) {
    const button = this.wrapperElement.querySelector(".video__wrapper--button");
    const iframe = this.wrapperElement.querySelector("iframe");

    if (button && iframe) {
      button.style.display = "none";
      iframe.style.display = "block";
    }
  };

  return Preview;
});
