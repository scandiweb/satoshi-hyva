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
      ...(data.faqs_rows && data.faqs_rows.length > 0
        ? {
            faqs: JSON.stringify(data.faqs_rows),
          }
        : {}),
    };
  };

  return BlockDirective;
});
