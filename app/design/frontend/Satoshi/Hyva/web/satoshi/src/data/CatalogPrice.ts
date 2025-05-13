// @ts-nocheck
import { Magics } from "alpinejs";

const regularPriceInclTaxKey = "oldPrice";
const regularPriceExclTaxKey = "baseOldPrice";
const finalPriceInclTaxKey = "finalPrice";
const finalPriceExclTaxKey = "basePrice";

function calculateCustomOptionPrices(activeCustomOptions, customOptionPrices) {
  return activeCustomOptions.reduce(
    (priceAccumulator, activeCustomOptionId) => {
      const customOptionPrice = customOptionPrices[activeCustomOptionId];
      if (customOptionPrice) {
        return (
          Number.parseFloat(priceAccumulator) +
          Number.parseFloat(customOptionPrice)
        );
      }
      return priceAccumulator;
    },
    0,
  );
}

export type TierPrice = {
  qty: number;
  price_qty: number;
  price_incl_tax: number;
  price_excl_tax: number;
  basePrice: number;
  price: number;
  percentage_value: number;
};

type PriceData = {
  baseOldPrice?: { amount: number };
  basePrice?: { amount: number };
  finalPrice?: { amount: number };
  msrpPrice?: { amount: number };
  oldPrice?: { amount: number };
  tierPrices?: TierPrice[];
  isMinimalPrice?: boolean;
};

type CatalogPriceProps = {
  productId: any;
  displayTax: boolean;
  finalPrice: number;
  tierPrices: TierPrice[];
  showRegularPriceLabel: boolean;
  finalPriceExclTax: number;
  calculatedBasePrice: number;
  customOptionBasePrices: any;
  calculatedBasePriceWithCustomOptions: number;
  displayPriceInclAndExclTax: boolean;
  configurableAndExclTax: boolean;
  isSaleable: boolean;
};

export type CatalogPriceType = {
  regularPriceKey: string;
  finalPriceKey: string;
  activeProductsPriceData: any;
  initialFinalPrice: number;
  calculatedFinalPrice: number | false;
  calculatedFinalPriceWithCustomOptions: number | false;
  initialTierPrices: TierPrice[];
  showRegularPriceLabel: boolean;
  customOptionPrices: any;
  initialBasePrice: number;
  calculatedBasePrice: number;
  customOptionBasePrices: any;
  calculatedBasePriceWithCustomOptions: number;
  activeCustomOptions: any;
  qty: number;
  eventListeners: any;

  updateCustomOptionActive(data: any): void;
  updateCustomOptionPrices(prices: any, basePrices: any): void;
  calculateFinalPrice(): void;
  calculatePriceLabelVisibility(): void;
  calculateFinalPriceWithCustomOptions(): void;
  getCustomOptionPrice(): number;
  getCustomOptionBasePrice(): any;
  getFormattedFinalPrice(): string;
  getFormattedBasePrice(): string | undefined;
  isPriceHidden(): boolean;
} & Magics<{}>;

export const CatalogPrice = ({
  productId,
  displayTax,
  finalPrice,
  tierPrices,
  showRegularPriceLabel,
  finalPriceExclTax,
  calculatedBasePrice,
  customOptionBasePrices,
  calculatedBasePriceWithCustomOptions,
  displayPriceInclAndExclTax,
  configurableAndExclTax,
  isSaleable,
}: CatalogPriceProps) =>
  <CatalogPriceType>{
    regularPriceKey: displayTax
      ? regularPriceInclTaxKey
      : regularPriceExclTaxKey,
    finalPriceKey: displayTax ? finalPriceInclTaxKey : finalPriceExclTaxKey,
    activeProductsPriceData: false,
    initialFinalPrice: finalPrice,
    calculatedFinalPrice: false,
    calculatedFinalPriceWithCustomOptions: false,
    initialTierPrices: tierPrices,
    showRegularPriceLabel,
    customOptionPrices: [],
    initialBasePrice: finalPriceExclTax,
    calculatedBasePrice,
    customOptionBasePrices,
    calculatedBasePriceWithCustomOptions,
    activeCustomOptions: [],
    qty: 1,

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

      if (displayPriceInclAndExclTax) {
        if (basePrices) {
          this.customOptionBasePrices = basePrices;
        }
      }

      this.calculateFinalPriceWithCustomOptions();
    },
    calculateFinalPrice() {
      /* Magento\ConfigurableProduct\Block\Product\View\Type\Configurable::getTierPricesByProduct option prices */
      /* only sets the basePrice key if display "display incl + excl" is set. Other product types always set it. */
      /* If display is set to excl tax, we need to fall back to 'price' for configurable products. */
      const getOptionTierPrice = (tierPrice, withTax) => {
        if (configurableAndExclTax) {
          return tierPrice["price"];
        } else {
          return tierPrice[withTax ? "price" : "basePrice"];
        }
      };

      const findApplicableTierPrice = (initialPrice, withTax) => {
        if (
          this.activeProductsPriceData &&
          this.activeProductsPriceData.tierPrices
        ) {
          return this.activeProductsPriceData.tierPrices.reduce(
            (acc, tierPrice) => {
              const tierPriceCandidate = getOptionTierPrice(tierPrice, withTax);
              if (this.qty >= tierPrice.qty && tierPriceCandidate < acc) {
                return tierPriceCandidate;
              }
              return acc;
            },
            this.activeProductsPriceData[
              withTax ? finalPriceInclTaxKey : finalPriceExclTaxKey
            ].amount,
          );
        } else {
          const key = withTax ? "price_incl_tax" : "price_excl_tax";
          return Object.values(this.initialTierPrices).reduce(
            (acc, tierPrice) => {
              if (this.qty >= tierPrice.price_qty && tierPrice[key] < acc) {
                return tierPrice[key];
              }
              return acc;
            },
            initialPrice,
          );
        }
      };

      this.calculatedFinalPrice = findApplicableTierPrice(
        this.initialFinalPrice,
        displayTax,
      );
      window.dispatchEvent(
        new CustomEvent("update-product-final-price", {
          detail: this.calculatedFinalPrice,
        }),
      );

      if (displayPriceInclAndExclTax) {
        this.calculatedBasePrice = findApplicableTierPrice(
          finalPriceExclTax,
          false,
        );
        window.dispatchEvent(
          new CustomEvent("update-product-base-price", {
            detail: { basePrice: this.calculatedBasePrice },
          }),
        );
      }
    },
    calculatePriceLabelVisibility() {
      this.showRegularPriceLabel =
        this.calculatedFinalPrice ===
          this.activeProductsPriceData[this.regularPriceKey].amount &&
        this.activeProductsPriceData.isMinimalPrice;
    },
    calculateFinalPriceWithCustomOptions() {
      const finalPrice = this.calculatedFinalPrice || this.initialFinalPrice;
      this.calculatedFinalPriceWithCustomOptions =
        finalPrice + this.getCustomOptionPrice();
      if (displayPriceInclAndExclTax) {
        const basePrice = this.calculatedBasePrice || this.initialBasePrice;
        this.calculatedBasePriceWithCustomOptions =
          basePrice + this.getCustomOptionBasePrice();
      }
    },
    getCustomOptionPrice() {
      return calculateCustomOptionPrices(
        this.activeCustomOptions,
        this.customOptionPrices,
      );
    },
    getCustomOptionBasePrice() {
      if (!displayPriceInclAndExclTax) {
        return undefined;
      }
      return calculateCustomOptionPrices(
        this.activeCustomOptions,
        this.customOptionBasePrices,
      );
    },
    getFormattedFinalPrice() {
      return hyva.formatPrice(
        this.calculatedFinalPriceWithCustomOptions ||
          this.calculatedFinalPrice ||
          this.initialFinalPrice,
      );
    },
    getFormattedBasePrice() {
      if (!displayPriceInclAndExclTax) {
        return undefined;
      }
      return hyva.formatPrice(
        this.calculatedBasePriceWithCustomOptions ||
          this.calculatedBasePrice ||
          this.initialBasePrice,
      );
    },
    isPriceHidden() {
      const finalPrice =
        this.calculatedFinalPriceWithCustomOptions ||
        this.calculatedFinalPrice ||
        this.initialFinalPrice;
      return isSaleable && finalPrice === 0;
    },
    eventListeners: {
      [`@update-prices-${productId}.window`](event) {
        this.activeProductsPriceData = event.detail;

        this.calculateFinalPrice();
        this.calculateFinalPriceWithCustomOptions();
        this.calculatePriceLabelVisibility();
      },
      [`@update-qty-${productId}.window`](event) {
        this.qty = event.detail;
        this.calculateFinalPrice();
        this.calculateFinalPriceWithCustomOptions();
      },
      ["@update-custom-option-active.window"](event) {
        this.updateCustomOptionActive(event.detail);
      },
      ["@update-custom-option-prices.window"](event) {
        this.updateCustomOptionPrices(event.detail);
      },
      ["@update-custom-option-base-prices.window"](event) {
        this.updateCustomOptionPrices(null, event.detail);
      },
    },
  };
