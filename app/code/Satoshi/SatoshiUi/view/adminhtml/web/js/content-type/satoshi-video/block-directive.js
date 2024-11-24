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
    data
  ) {
    const tidyLink = linkHelper.prototype.tidyLink;

    console.log("data here", data);

    return {
      heading: data.heading,
      subheading: data.subheading,
      video_source: data.video_source,
      autoplay: data.autoplay,
      ...(data.image[0] ? { image: data.image[0].url } : {}),
    };
  };

  return BlockDirective;
});
