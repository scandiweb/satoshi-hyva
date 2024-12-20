import { ProductPageType } from "./ProductPage.ts";

export type OptionSelection = {
  qty: number;
  customQty: string;
  optionId: string;
  prices: {
    oldPrice: { amount: string };
    basePrice: { amount: string };
    finalPrice: { amount: string };
  };
  priceType: string;
  tierPrice: any[];
  name: string;
  canApplyMsrp: boolean;
};

export type BundleOption = {
  selections: Record<string, OptionSelection>;
  title: string;
  isMulti: boolean;
  position: number;
};

export type OptionConfig = {
  options: Record<string, BundleOption>;
  finalPriceKey: string;
  regularPriceKey: string;
  basePriceKey?: string;
};

export type BundleOptionsType = {
  optionConfig: OptionConfig;
  regularPriceKey: string;
  finalPriceKey: string;
  basePriceKey?: string;
  productFinalPrice: boolean | Record<string, any>;
  activeSelectOptions: Record<string, any>;
  calculateTotalPrice(): void;
  dispatchFinalPrice(): void;
  dispatchOptionSelection(): void;
  getQtyValue(optionId: string): string;
  getSelectionOptionConfig(optionId: string): any;
  getQtyDisabled(optionId: string): boolean;
  setQtyValue(optionId: string, value: string): void;
} & ProductPageType;

export const BundleOptions = (
  optionConfig: OptionConfig,
  regularPriceKey: string,
  finalPriceKey: string,
  basePriceKey?: string
) =>
  <BundleOptionsType>{
    optionConfig,
    regularPriceKey,
    finalPriceKey,
    basePriceKey,
    productFinalPrice: false,
    activeSelectOptions: {},

    calculateTotalPrice() {
      let selectedProductsPerOption: Record<string, any[]> = {};

      // Iterate over all options
      Object.entries(this.optionConfig.options).forEach(([optionId, option]) => {
        const isMobile = Alpine.store('main').isMobile;
        const optionElement = document.querySelector(
          `[data-option-id="${optionId}-${isMobile ? 'mobile' : 'desktop'}"]`
        ) as HTMLInputElement | HTMLSelectElement | null;
        const id = 'bundle-option-' + optionId + '-qty-input-' + (isMobile ? 'mobile' : 'desktop');
        const qtyElement = document.getElementById(id) as HTMLInputElement | null;

        let selectedOption = selectedProductsPerOption[optionId] || [];

        if (optionElement) {
          // Ensure type safety for `checked` and `selected` properties
          if (('checked' in optionElement && optionElement.checked) || ('selected' in optionElement && optionElement.selected)) {
            const selectionId = optionElement.dataset.selectionId;
            if (selectionId) {
              const optionSelection = option.selections[selectionId];
              selectedOption.push({
                data: optionSelection,
                qty: qtyElement?.value || 1,
              });
            }
          }
        } else {
          // Handle multi-option selections
          Object.entries(option.selections).forEach(([selectionId, selection]) => {
            const selectionElement = document.querySelector(
              `[data-option-id="${optionId}-${selectionId}-${isMobile ? 'mobile' : 'desktop'}"]`
            ) as HTMLInputElement | HTMLSelectElement | null;
            if (selectionElement && (('checked' in selectionElement && selectionElement.checked) || ('selected' in selectionElement && selectionElement.selected))) {
              selectedOption.push({
                data: selection,
                qty: qtyElement?.value || 1,
              });
            }
          });
        }

        selectedProductsPerOption[optionId] = [...(selectedProductsPerOption[optionId] || []), ...selectedOption];
      });

      // Calculate the lowest price for each selected product in each option
      const gatherLowestPriceForOptionProduct = (
        accPrice: Record<string, number>,
        product: any
      ) => {
        const lowestPrice = product.data.tierPrice.reduce(
          (finalValue: any, tierPrice: any) => {
            if (product.qty >= tierPrice.price_qty) {
              return tierPrice.prices[this.finalPriceKey].amount < finalValue[this.finalPriceKey].amount
                ? tierPrice.prices
                : finalValue;
            }
            return finalValue;
          },
          product.data.prices
        );

        return {
          oldPrice: accPrice.oldPrice + lowestPrice.oldPrice.amount * product.qty,
          finalPrice: accPrice.finalPrice + lowestPrice[this.finalPriceKey].amount * product.qty,
          basePrice: accPrice.basePrice + (lowestPrice.basePrice?.amount || 0) * product.qty,
        };
      };

      // Sum up all selected options prices
      this.productFinalPrice = Object.values(selectedProductsPerOption).reduce(
        (totalPrice, option) => {
          const totalOptionPrice = option.reduce(
            gatherLowestPriceForOptionProduct,
            {oldPrice: 0, finalPrice: 0, basePrice: 0}
          );
          return {
            oldPrice: totalPrice.oldPrice + totalOptionPrice.oldPrice,
            finalPrice: totalPrice.finalPrice + totalOptionPrice.finalPrice,
            basePrice: totalPrice.basePrice + totalOptionPrice.basePrice,
          };
        },
        {oldPrice: 0, finalPrice: 0, basePrice: 0}
      );

      // Update the selected bundle options
      this.selectedBundleOptions = Object.keys(selectedProductsPerOption).map((optionId) => {
        return {
          label: this.optionConfig.options[optionId].title,
          products: selectedProductsPerOption[optionId].map((product) => ({
            qty: product.qty,
            name: product.data.name,
          })),
        };
      });

      this.dispatchFinalPrice();
      this.dispatchOptionSelection();
    },

    // Dispatch the final price event to update the UI
    dispatchFinalPrice() {
      window.dispatchEvent(new CustomEvent('update-bundle-option-prices', {detail: this.productFinalPrice}));
      this._updateSelectedVariantCartState();
    },

    // Dispatch the selected bundle options event
    dispatchOptionSelection() {
      window.dispatchEvent(new CustomEvent('update-bundle-option-selection', {detail: this.selectedBundleOptions}));
    },

    // Get the quantity of a selected option
    getQtyValue(optionId) {
      const selectionConfig = this.getSelectionOptionConfig(optionId);
      return selectionConfig ? selectionConfig.qty : '0';
    },

    // Get the configuration of the selected option
    getSelectionOptionConfig(optionId) {
      const activeSelectOption = this.activeSelectOptions[optionId];
      if (!activeSelectOption) return false;
      return this.optionConfig.options[optionId].selections[activeSelectOption[0] ?? activeSelectOption];
    },

    // Check if the quantity input should be disabled for a specific option
    getQtyDisabled(optionId) {
      const selectionConfig = this.getSelectionOptionConfig(optionId);
      return !selectionConfig || selectionConfig.customQty === '0';
    },

    // Set the quantity of a selected option
    setQtyValue(optionId, value) {
      const selectionConfig = this.getSelectionOptionConfig(optionId);
      if (selectionConfig) selectionConfig.qty = value;
    },
  };
