export type DownloadableProductType = {
  [key: string | symbol]: any;
  selectedValues: string[];

  init(): void;
  toggleOption(optionId: string, value?: boolean): void;
  validate(): void;
  linkSelectionChange(checkbox: Record<string, any>, title: string): void;
  areAllSelected(): boolean;
  toggleAll(): void;
};

export const DownloadableProduct = (
  config: any,
  configuredLinks: any,
  key: string,
) =>
  <DownloadableProductType>{
    selectedValues: [],
    init() {
      this.linksPurchasedSeparately = true;
      const optionPrices = Object.keys(config.links).reduce(
        (priceMap: any, optionId) => {
          priceMap[optionId] = config.links[optionId][key];
          return priceMap;
        },
        {},
      );

      this.$nextTick(() => {
        window.dispatchEvent(
          new CustomEvent("update-custom-option-prices", {
            detail: optionPrices,
          }),
        );
        configuredLinks.map((linkId: any) => {
          this.toggleOption(linkId, true);
        });
        this.validate();
      });
    },

    toggleOption(optionId, value = true) {
      const elementToSelect = this.$root.querySelector("#links_" + optionId);
      if (elementToSelect) {
        elementToSelect.checked = value;
        elementToSelect.dispatchEvent(new CustomEvent("change"));
      }
    },
    validate() {
      const message =
        this.selectedValues.length === 0
          ? "Please select one of the options."
          : "";
      const fields = this.$root.querySelectorAll('input[name="links[]"]');
      fields[fields.length - 1].setCustomValidity(message);
    },
    linkSelectionChange(checkbox, title) {
      if (checkbox.checked) {
        this.selectedDownloadableLinks.includes(title)
          ? null
          : this.selectedDownloadableLinks.push(title);
      } else {
        this.selectedDownloadableLinks.splice(
          this.selectedDownloadableLinks.indexOf(title),
          1,
        );
      }

      const payload = {
        customOptionId: checkbox.value,
        active: checkbox.checked,
      };
      window.dispatchEvent(
        new CustomEvent("update-custom-option-active", { detail: payload }),
      );
      this.validate();
      this._updateSelectedVariantCartState();
    },
    areAllSelected() {
      /**
       * The way x-model works it can have duplicates, so we create a new set with unique values only.
       */
      return (
        new Set(this.selectedValues).size === Object.keys(config.links).length
      );
    },
    toggleAll() {
      const targetValue = !this.areAllSelected();
      Object.keys(config.links).map((link) => {
        this.toggleOption(link, targetValue);
      });
    },
  };
