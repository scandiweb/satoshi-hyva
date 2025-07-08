define([
  "Satoshi_SatoshiUi/js/content-type/block-directive",
  "Satoshi_SatoshiUi/js/helper/link",
], function (BlockDirectiveBase, linkHelper) {
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
    const tidyLink = linkHelper.prototype.tidyLink;

    return {
      ...(data.before_image[0] ? { before_image: data.before_image[0].url } : {}),
      ...(data.after_image[0] ? { after_image: data.after_image[0].url } : {}),
      section_height: data.section_height,
    };
  };

  return BlockDirective;
});
