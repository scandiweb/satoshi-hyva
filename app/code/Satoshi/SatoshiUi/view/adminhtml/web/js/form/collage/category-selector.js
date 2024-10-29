define(["uiRegistry", "Magento_Ui/js/form/element/ui-select"], function (
  uiRegistry,
  UiSelect,
) {
  "use strict";

  return UiSelect.extend({
    /**
     * Initializes UISelect component.
     *
     * @returns {UISelect} Chainable.
     */
    initialize: function () {
      const initialized = this._super();

      var field = uiRegistry.get(`name = ${this.parentName}.item_type`);
      if (field && field.initialValue) {
        if (field.initialValue == "item_category") {
          this.show();
        } else {
          this.hide();
        }
      }

      return initialized;
    },
  });
});
