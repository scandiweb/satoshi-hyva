define(["Satoshi_SatoshiUi/js/content-type/block-directive"], function (
  BlockDirectiveBase,
) {
  "use strict";
  const $super = BlockDirectiveBase.prototype;

  function BlockDirective(parent, config, stageId) {
    BlockDirectiveBase.call(this, parent, config, stageId);
  }

  BlockDirective.prototype = Object.create($super);

  var _proto = BlockDirective.prototype;

  _proto.getAdditionalBlockAttributes = function getAdditionalBlockAttributes(
    data,
  ) {
    return {
      heading: data.heading,
      ...(data.quotes_slides && data.quotes_slides.length > 0
        ? {
            quotes: JSON.stringify(data.quotes_slides),
          }
        : {}),
    };
  };

  return BlockDirective;
});
