function updateDom(wrapperElement, d, h, m, s) {
  wrapperElement.querySelector(".countdown__part--days").innerHTML = d;
  wrapperElement.querySelector(".countdown__part--hours").innerHTML = h;
  wrapperElement.querySelector(".countdown__part--minutes").innerHTML = m;
  wrapperElement.querySelector(".countdown__part--seconds").innerHTML = s;
}

define([
  "Magento_PageBuilder/js/content-type/preview",
  "Magento_PageBuilder/js/events",
], function (PreviewBase, _events) {
  "use strict";
  var $super;

  function Preview(parent, config, stageId) {
    PreviewBase.call(this, parent, config, stageId);
    let timerId = null;

    _events.on("satoshi_countdown:renderAfter", function (args) {
      if (!args.contentType.dataStore.state.deadline || !args.element) {
        return;
      }
      const wrapperElement = args.element;

      clearInterval(timerId);
      let target = new Date(args.contentType.dataStore.state.deadline);
      const now = new Date();
      let remainingTime = Number(target) - Number(now);

      if (remainingTime <= 0) {
        updateDom(wrapperElement, 0, 0, 0, 0);
        return;
      }

      timerId = setInterval(() => {
        const now = new Date();
        const remainingTime = Number(target) - Number(now);

        if (remainingTime <= 0) {
          clearInterval(timerId);
        } else {
          const d = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
          const h = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
          const m = Math.floor((remainingTime / 1000 / 60) % 60);
          const s = Math.floor((remainingTime / 1000) % 60);
          updateDom(wrapperElement, d, h, m, s);
        }
      }, 1000);
    });

    this.contentType.dataStore.subscribe((state) => {
      if (!state.deadline || !this.wrapperElement) {
        return;
      }
      const wrapperElement = this.wrapperElement;

      clearInterval(timerId);
      let target = new Date(state.deadline);
      const now = new Date();
      let remainingTime = Number(target) - Number(now);

      if (remainingTime <= 0) {
        updateDom(wrapperElement, 0, 0, 0, 0);
        return;
      }

      timerId = setInterval(() => {
        const now = new Date();
        const remainingTime = Number(target) - Number(now);

        if (remainingTime <= 0) {
          clearInterval(timerId);
        } else {
          const d = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
          const h = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
          const m = Math.floor((remainingTime / 1000 / 60) % 60);
          const s = Math.floor((remainingTime / 1000) % 60);
          updateDom(wrapperElement, d, h, m, s);
        }
      }, 1000);
    });
  }

  Preview.prototype = Object.create(PreviewBase.prototype);
  $super = PreviewBase.prototype;

  return Preview;
});
