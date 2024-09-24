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
    return data.guarantees_columns && data.guarantees_columns.length > 0
      ? {
          guarantees: JSON.stringify(data.guarantees_columns),
        }
      : {};
  };

  return BlockDirective;
});
