define(["Magento_PageBuilder/js/content-type/preview"], function (PreviewBase) {
  "use strict";
  var $super;

  function Preview(parent, config, stageId) {
    PreviewBase.call(this, parent, config, stageId);
    this.openQuestion = 1;
  }

  Preview.prototype = Object.create(PreviewBase.prototype);
  $super = PreviewBase.prototype;

  Preview.prototype.handleClick = function handleClick(preview, event) {
    event.preventDefault();
    const parentContainer = event.currentTarget.closest(".faq");
    parentContainer.classList.toggle("faq--open");
    const panel = parentContainer.querySelector(".accordion-panel");
    parentContainer.style.setProperty(
      "--max-height",
      parentContainer.classList.contains("faq--open")
        ? `${panel.scrollHeight}px`
        : `0px`,
    );
  };
  return Preview;
});
