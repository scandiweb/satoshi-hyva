define(["Magento_PageBuilder/js/content-type/preview"], function (PreviewBase) {
  "use strict";
  var $super;
  var _index = 0;

  function Preview(parent, config, stageId) {
    PreviewBase.call(this, parent, config, stageId);
  }

  Preview.prototype = Object.create(PreviewBase.prototype);
  $super = PreviewBase.prototype;

  Preview.prototype.scrollPrev = function scrollPrev(preview, event) {
    event.preventDefault();
    const parentContainer = event.currentTarget.closest(".quotes");
    const slider = parentContainer.querySelector(".quotes__slider");
    const slides = slider.querySelectorAll(".quotes__slide");

    if (!slider || _index < 0 || !slides[_index - 1]) {
      return;
    }
    _index--;
    slides[_index].scrollIntoView();
  };

  Preview.prototype.scrollNext = function scrollNext(preview, event) {
    event.preventDefault();
    const parentContainer = event.currentTarget.closest(".quotes");
    const slider = parentContainer.querySelector(".quotes__slider");
    const slides = slider.querySelectorAll(".quotes__slide");

    if (!slider || _index > slides.length || !slides[_index + 1]) {
      return;
    }
    _index++;
    slides[_index].scrollIntoView();
  };

  return Preview;
});
