define([
  "underscore",
  "uiRegistry",
  "Magento_Ui/js/form/element/select",
], function (_, uiRegistry, select) {
  "use strict";

  return select.extend({
    /**
     * On value change handler.
     *
     * @param {String} value
     */
    onUpdate: function (value) {
      var field1 = uiRegistry.get(`name = ${this.parentName}.item_category`);
      if (field1) {
        if (field1.index == value) {
          field1.show();
        } else {
          field1.hide();
        }
      }

      var field2 = uiRegistry.get(`name = ${this.parentName}.item_product`);
      if (field2) {
        if (field2.index == value) {
          field2.show();
        } else {
          field2.hide();
        }
      }

      return this._super();
    },
  });
});
