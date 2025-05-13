import { Magics } from "alpinejs";
import { TierPrice } from "./CatalogPrice";

export type BundlePriceType = {
  initialFinalPrice: number;
  initialTierPrices: TierPrice[];
  initialBasePrice?: number;
  calculatedBasePrice?: boolean;
  customOptionBasePrices?: Array<any>;
  calculatedBasePriceWithCustomOptions?: boolean;
  activeProductsPriceData: Record<string, any> | false;
  calculatedFinalPrice: boolean;
  calculatedFinalPriceWithCustomOptions: boolean;
  customOptionPrices: any;
  activeCustomOptions: any;
  qty: number;
  eventListeners: Record<string, Function>;

  init(): void;
  updateCustomOptionActive(data: any): void;
  updateCustomOptionPrices(prices: any, basePrices: any): void;
  calculateFinalPrice(): void;
  calculateFinalPriceWithCustomOptions(): void;
  getFormattedFinalPrice(): string;
  getFormattedBasePrice(): string;
} & Magics<{}>;

type BundlePriceProps = {
  productId: number;
  initialFinalPrice: number;
  initialTierPrices: TierPrice[];
  initialBasePrice?: number;
  calculatedBasePrice?: boolean;
  customOptionBasePrices?: Array<any>;
  calculatedBasePriceWithCustomOptions?: boolean;
  displayPriceInclAndExclTax: boolean;
};

export const BundlePrice = ({
  productId,
  initialFinalPrice,
  initialTierPrices,
  initialBasePrice,
  calculatedBasePrice,
  customOptionBasePrices,
  calculatedBasePriceWithCustomOptions,
  displayPriceInclAndExclTax,
}: BundlePriceProps) =>
  <BundlePriceType>{
    activeProductsPriceData: false,
    initialFinalPrice,
    initialTierPrices,
    calculatedFinalPrice: false,
    calculatedFinalPriceWithCustomOptions: false,
    customOptionPrices: [],
    activeCustomOptions: [],
    initialBasePrice,
    calculatedBasePrice,
    customOptionBasePrices,
    calculatedBasePriceWithCustomOptions,
    qty: 1,

    eventListeners: {},

    init() {
      this.eventListeners = {
        ...{
          ["@update-bundle-option-prices.window"](event: CustomEvent) {
            this.activeProductsPriceData = event.detail;
            this.calculateFinalPrice();
            this.calculateFinalPriceWithCustomOptions();
          },
          [`@update-qty-${productId}.window`](event: CustomEvent) {
            this.qty = event.detail;
            this.calculateFinalPrice();
            this.calculateFinalPriceWithCustomOptions();
          },
          ["@update-custom-option-active.window"](event: CustomEvent) {
            this.updateCustomOptionActive(event.detail);
          },
          ["@update-custom-option-prices.window"](event: CustomEvent) {
            this.updateCustomOptionPrices(event.detail);
          },
        },
        ...(displayPriceInclAndExclTax
          ? {
              ["@update-custom-option-base-prices.window"](event: CustomEvent) {
                this.updateCustomOptionPrices(null, event.detail);
              },
            }
          : {}),
      };
    },

    updateCustomOptionActive(data) {
      let activeCustomOptions = this.activeCustomOptions;
      const customOptionId = data.customOptionId;

      if (data.active) {
        if (!activeCustomOptions.includes(customOptionId)) {
          activeCustomOptions.push(data.customOptionId);
        }
      } else {
        if (customOptionId && activeCustomOptions.includes(customOptionId)) {
          let index = activeCustomOptions.indexOf(customOptionId);
          activeCustomOptions.splice(index, 1);
        }
      }
      this.calculateFinalPriceWithCustomOptions();
    },

    updateCustomOptionPrices(prices, basePrices) {
      if (prices) {
        this.customOptionPrices = prices;
      }

      if (basePrices && displayPriceInclAndExclTax) {
        this.customOptionBasePrices = basePrices;
      }

      this.calculateFinalPriceWithCustomOptions();
    },

    calculateFinalPrice() {
      /* This function only applies the tier price discounts for the bundled product. */
      /* The tier prices of associated products are already included in this.activeProductsPriceData */
      const calcPrice = (price: any) => {
        return this.initialTierPrices.reduce((currentValue, tierPrice) => {
          if (this.qty >= tierPrice.price_qty) {
            const discount = price * (tierPrice.percentage_value / 100);
            return price - discount < currentValue
              ? price - discount
              : currentValue;
          }
          return currentValue;
        }, price);
      };
      const price =
        ((this.activeProductsPriceData &&
          this.activeProductsPriceData.finalPrice) ||
          0) + this.initialFinalPrice;
      this.calculatedFinalPrice = calcPrice(price);

      window.dispatchEvent(
        new CustomEvent("update-product-final-price", {
          detail: this.calculatedFinalPrice,
        }),
      );

      if (displayPriceInclAndExclTax) {
        const basePrice =
          ((this.activeProductsPriceData &&
            this.activeProductsPriceData.basePrice) ||
            0) + this.initialBasePrice;
        this.calculatedBasePrice = calcPrice(basePrice);

        window.dispatchEvent(
          new CustomEvent("update-product-base-price", {
            detail: this.calculatedBasePrice,
          }),
        );
      }
    },

    calculateFinalPriceWithCustomOptions() {
      let finalPrice = this.calculatedFinalPrice || this.initialFinalPrice;

      this.calculatedFinalPriceWithCustomOptions =
        this.activeCustomOptions.reduce(
          (priceAccumulator: any, activeCustomOptionId: any) => {
            const customOptionPrice =
              this.customOptionPrices[activeCustomOptionId];
            if (customOptionPrice) {
              return (
                Number.parseFloat(priceAccumulator) +
                Number.parseFloat(customOptionPrice)
              );
            }
            return finalPrice;
          },
          finalPrice,
        );

      if (displayPriceInclAndExclTax) {
        // const basePrice = this.calculatedBasePrice || this.initialBasePrice; // ??? unfinished
        //this.calculatedBasePriceWithCustomOptions = basePrice +this.getCustomOptionBasePrice();
      }
    },
    getFormattedFinalPrice() {
      return window.hyva.formatPrice(
        this.calculatedFinalPriceWithCustomOptions ||
          this.calculatedFinalPrice ||
          this.initialFinalPrice,
      );
    },

    getFormattedBasePrice() {
      return window.hyva.formatPrice(
        this.calculatedBasePriceWithCustomOptions ||
          this.calculatedBasePrice ||
          this.initialBasePrice,
      );
    },
  };
