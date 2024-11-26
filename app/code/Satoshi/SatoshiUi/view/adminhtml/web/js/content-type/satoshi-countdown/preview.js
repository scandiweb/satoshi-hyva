define(["Magento_PageBuilder/js/content-type/preview"], function (PreviewBase) {
  "use strict";
  var $super;

  function Preview(parent, config, stageId) {
    PreviewBase.call(this, parent, config, stageId);
    let timerId = null;

    this.contentType.dataStore.subscribe((state) => {
      if (!state.deadline) {
        return;
      }

      clearInterval(timerId);
      let target = new Date(state.deadline);
      const now = new Date();
      let remainingTime = Number(target) - Number(now);

      if (remainingTime <= 0) {
        this.wrapperElement.querySelector(
          ".countdown__part--days"
        ).innerHTML = 0;
        this.wrapperElement.querySelector(
          ".countdown__part--hours"
        ).innerHTML = 0;
        this.wrapperElement.querySelector(
          ".countdown__part--minutes"
        ).innerHTML = 0;
        this.wrapperElement.querySelector(
          ".countdown__part--seconds"
        ).innerHTML = 0;
        return;
      }

      timerId = setInterval(() => {
        const now = new Date();
        const remainingTime = Number(target) - Number(now);

        if (remainingTime <= 0) {
          clearInterval(timerId);
        } else {
          this.wrapperElement.querySelector(
            ".countdown__part--days"
          ).innerHTML = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
          this.wrapperElement.querySelector(
            ".countdown__part--hours"
          ).innerHTML = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
          this.wrapperElement.querySelector(
            ".countdown__part--minutes"
          ).innerHTML = Math.floor((remainingTime / 1000 / 60) % 60);
          this.wrapperElement.querySelector(
            ".countdown__part--seconds"
          ).innerHTML = Math.floor((remainingTime / 1000) % 60);
        }
      }, 1000);
    });
  }

  Preview.prototype = Object.create(PreviewBase.prototype);
  $super = PreviewBase.prototype;

  return Preview;
});
