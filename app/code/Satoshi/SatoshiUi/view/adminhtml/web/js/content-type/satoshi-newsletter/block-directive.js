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
      template: 'Magento_Newsletter::subscribe.phtml',
      title: data.title,
      subtitle: data.subtitle,
      button_label: data.button_label,
      wrapped: data.wrapped,
    };
  };

  return BlockDirective;
});
