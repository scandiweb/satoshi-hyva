define(["Magento_PageBuilder/js/content-type/preview"], function (PreviewBase) {
  "use strict";
  var $super;

  function Preview(parent, config, stageId) {
    PreviewBase.call(this, parent, config, stageId);
  }

  Preview.prototype = Object.create(PreviewBase.prototype);
  $super = PreviewBase.prototype;

  Preview.prototype.onPointerDown = function onPointerDown(preview, event) {
    const move = (e) => {
      if (!this.wrapperElement) {
        return;
      }

      const rect = this.wrapperElement.getBoundingClientRect();

      // calculate % of X position relative to the wrapper
      const x = e.clientX - rect.left;

      const exposure = Math.min(100, Math.max(0, (x / rect.width) * 100));

      this.wrapperElement.style.setProperty(
        "--exposure",
        `${100 - parseInt(exposure, 10)}%`
      );
    };

    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
    };

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  };

  return Preview;
});
