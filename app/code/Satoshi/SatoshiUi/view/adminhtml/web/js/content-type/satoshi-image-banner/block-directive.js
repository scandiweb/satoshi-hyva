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
      heading: data.heading,
      description: data.description,
      button_label: data.button_label,
      button_link: JSON.stringify(tidyLink(data.button_link)),
      ...(data.image[0] ? { image: data.image[0].url } : {}),
      overlay_opacity: +data.overlay_opacity / 100,
      banner_height: data.banner_height,
      desktop_content_position: data.desktop_content_position,
      mobile_content_alignment: data.mobile_content_alignment,
    };
  };

  return BlockDirective;
});
