import { withXAttributes } from "alpinejs";
import { POPUP_OVERLAY_CLICK_EVENT } from "../store/Popup";
import { CartItem } from "../store/Cart";

export type ProductPageType = {
  [key: string | symbol]: any;

  isVariantInCart: boolean;
  isLoadingCart: boolean;
  variantQty: number;
  selectedValues: string[];
  selectedDownloadableLinks: string[];
  selectedBundleOptions: Record<string, any>[];
  linksPurchasedSeparately: boolean;
  productId: string;
  groupedIds: string[];
  isScrollingToTop: boolean;
  cartItemKey: string | undefined;
  productActionsPopup: string;
  swatchConfig: {
    [key: string]: {
      [key: string]: AttributeOption | string | any;
    };
  };
  optionConfig: OptionConfig | undefined;
  allowedAttributeOptions: Array<AllowedAttributeOption[]>;
  isGroupValid: boolean;

  readonly isProductBeingRemoved: boolean;
  readonly isProductBeingAdded: boolean;
  init(): void;
  setProductPageProps(props: {
    productId: string;
    isScrollingToTop?: Boolean;
    groupedIds?: string[];
  }): void;
  _updateSelectedVariantCartState(): void;
  checkIsItemInCart(item: CartItem): boolean;
  toggleStickyProductActions(show: boolean): void;
  decreaseQty(): void;
  increaseQty(): void;
  setQuantity(quantity: number): void;
  addToCart(event: Event): void;
  listenAddedToCart(formData: FormData): void;
  showProductActions(): void;
  hideProductActions(): void;
  _handleStickyProductActionsClosure(): boolean | void;
  quickBuy(): void;
  scrollToTop(): void;
  changeOption(attributeId: number, value: string): void;

  initAttributes(
    swatchConfig: {
      [key: string]: {
        [key: string]: AttributeOption | string | any;
      };
    },
    optionConfig: OptionConfig,
  ): void;
  optionIsEnabled(attributeId: number, optionId: string): boolean;
  getSwatchBackgroundStyle(attributeId: number, optionId: string, modifyOpacity: boolean): string;
  optionIsActive(attributeId: number, optionId: string): boolean;
  getAllowedAttributeOptions(attributeId: number): AllowedAttributeOption[];
  findAllowedAttributeOptions(): void;
  calculateAllowedAttributeOptions(
    selectedValues: string[],
  ): Array<AllowedAttributeOption[]>;
  removeAttrFromSelection(
    selectedValues: string[],
    attributeId: number,
  ): string[];
  calculateAvailableProductIndexes(selectedOptions: string[]): string[];
  isTextSwatch(attributeId: number, optionId: string): boolean;
  getSwatchConfig(
    attributeId: number,
    optionId: string,
  ): boolean | AttributeOption | string;
  getSwatchType(attributeId: number, optionId: string): string;
  getAttributeSwatchData(attributeId: number): any;
  getSwatchText(attributeId: number, optionId: string): string;
  getOptionLabelFromOptionConfig(attributeId: number, optionId: string): string;
  getAllAttributeOptions(attributeId: number): Record<string, any>[];
  getTruncatedAttributeOptions(attributeId: number): Record<string, any>[];
  getMoreAttributeOptionsText(attributeId: number): string;
  getVisualSwatchType(attributeId: number, targetOptionId: string): string;
  getTypeOfFirstOption(attributeId: number): string | void;
  mapSwatchTypeNumberToTypeCode(typeNumber: number): string;
  findProductIdsForPartialSelection(optionSelection: string[]): any;
  getProductIdsForOption(option: Record<string, any>): any;
  findAttributeByOptionId(optionId: string): number | void;
  findAttributeByOptionId(optionId: string): string | void;
  findSimpleIndex(): void;
  calculateSimpleIndexForPartialSelection(selectedValues: string[]): string;
  sortImagesByPosition(images: Record<string, any>[]): Record<string, any>[];
};

type OptionConfig = {
  attributes: Record<string, any>;
  template: string;
  currencyFormat: string;
  optionPrices: any;
  priceFormat: any;
  prices: any;
  productId: string;
  chooseText: string;
  images: any;
  index: Record<string, any>;
  salable: any;
  canDisplayShowOutOfStockStatus: any;
  channel: string;
  salesChannelCode: string;
  sky: any;
  defaultValues?: any;
};
type AttributeOption = {
  type: string;
  value: string;
  label: string;
};
type AllowedAttributeOption = {
  id: string;
  label: string;
  products: string[];
};

const POPUP_BOTTOM_ACTIONS = "product_bottom_actions";
const TRUNCATED_ATTRIBUTE_OPTIONS_MAX_NUMBER = 5;

export const ProductPage = () =>
  <ProductPageType>{
    isVariantInCart: false,
    isLoadingCart: false,
    variantQty: 1,
    selectedValues: [],
    selectedDownloadableLinks: [],
    linksPurchasedSeparately: false,
    selectedBundleOptions: [],
    productId: "",
    groupedIds: [],
    isScrollingToTop: true,
    cartItemKey: undefined,
    productActionsPopup: "product_actions",
    swatchConfig: {},
    optionConfig: undefined,
    allowedAttributeOptions: [],
    isGroupValid: true,

    get isProductBeingRemoved() {
      return Alpine.store("cart").removingItemId === this.cartItemKey;
    },

    get isProductBeingAdded() {
      return Alpine.store("cart").addingItemIds.includes(this.productId);
    },

    init() {
      this.$watch("$store.cart.cartItems", () => {
        this._updateSelectedVariantCartState();
      });

      document.addEventListener(POPUP_OVERLAY_CLICK_EVENT, () => {
        if (this.$store.popup.currentPopup === this.productActionsPopup) {
          this._handleStickyProductActionsClosure();
        }
      });
    },

    setProductPageProps({
                          productId,
                          isScrollingToTop = false,
                          groupedIds = [],
                        }) {
      this.productId = productId;
      this.productActionsPopup += `-${productId}`;
      this.isScrollingToTop = !!isScrollingToTop;
      this.groupedIds = groupedIds;

      Alpine.nextTick(() => {
        this._updateSelectedVariantCartState();
      });
    },

    _updateSelectedVariantCartState() {
      const cartItem = Alpine.store("cart").cartItems.find(
        this.checkIsItemInCart.bind(this),
      );

      this.isVariantInCart = !!cartItem;
      this.variantQty = cartItem?.qty || 1;
      this.cartItemKey = cartItem?.item_id;
    },

    checkIsItemInCart(item: CartItem) {
      // Skip deleted items
      if (item.isDeleted) {
        return false;
      }

      // Match product id
      if (item.product_id != this.productId) {
        return false;
      }

      // Match options of downloadable product
      if (item.product_type === "downloadable") {
        if (!this.linksPurchasedSeparately) {
          return true;
        }

        if (
          item.options.length &&
          Array.isArray(item.options[0].value) &&
          item.options[0].value.length === this.selectedDownloadableLinks.length
        ) {
          const links = item.options[0].value as string[];
          return this.selectedDownloadableLinks.every((title) =>
            links.some((link) => link === title),
          );
        }
        return false;
      }

      // Bundle products
      if (item.product_type === "bundle") {
        return (
          item.options.length === this.selectedBundleOptions.length &&
          item.options.every((option: Record<string, any>) => {
            const selectedProds = this.selectedBundleOptions.find(
              (selection) => selection.label === option.label,
            )?.products;
            return (
              selectedProds?.length &&
              option.value.length === selectedProds?.length &&
              option.value.every((one: string, i: number) =>
                one.startsWith(
                  `${selectedProds[i].qty} x ${selectedProds[i].name}`,
                ),
              )
            );
          })
        );
      }

      // Match options / configurable product
      const keys = Object.keys(this.selectedValues);
      if (keys.length !== item.options.length) {
        return false;
      }
      return keys.every((key) =>
        item.options.some(
          (option) =>
            option.option_id === parseInt(key) &&
            option.option_value === this.selectedValues[parseInt(key)],
        ),
      );
    },

    toggleStickyProductActions(show: boolean) {
      if (
        this.$store.popup.currentPopup &&
        this.$store.popup.currentPopup !== POPUP_BOTTOM_ACTIONS
      ) {
        return;
      }

      if (!show) {
        this.$store.popup.hidePopup(POPUP_BOTTOM_ACTIONS);
      } else {
        this.$store.popup.showPopup(POPUP_BOTTOM_ACTIONS, true);
      }
    },

    decreaseQty() {
      this.variantQty -= 1;
      Alpine.store("cart").decreaseQty(this.cartItemKey!);
    },

    increaseQty() {
      this.variantQty += 1;
      Alpine.store("cart").increaseQty(this.cartItemKey!);
    },

    setQuantity(quantity: number) {
      this.variantQty = Math.max(0, Number(quantity));
      Alpine.store("cart").setQty(quantity, this.cartItemKey!);
    },

    validateGroupedProduct() {
      const validateInputs = Array.from(
        document.querySelectorAll("input[name^=super_group]"),
      );

      // at least one of the inputs has to have a qty > 0
      this.isGroupValid = !!validateInputs.filter(
        (input: Record<string, any>) => input.value > 0,
      ).length;

      // we set or unset validity for all fields at once
      // and empty string un-sets invalidity
      validateInputs.map((input: Record<string, any>) => {
        input.setCustomValidity(
          this.isGroupValid ? "" : "Please specify the quantity of product(s).",
        );
      });

      if (!this.isGroupValid) {
        const selector = Alpine.store('main').isMobile ? `#product_addtocart_form_${this.productId}_mobile` : `#product_addtocart_form_${this.productId}_desktop`;
        // this triggers an immediate display of the form errors
        // @ts-ignore
        document.querySelector(selector)!.reportValidity();
        return false;
      }
      return true;
    },

    addToCart(event) {
      // Validated if grouped product
      if (this.groupedIds.length) {
        if (!this.validateGroupedProduct()) {
          return event.preventDefault();
        }
      }

      const formEl = event.target as HTMLFormElement;
      const formData = new FormData(formEl);
      formData.set('form_key', window.hyva.getFormKey())

      if (!Alpine.store("cart").addingItemIds.includes(this.productId)) {
        Alpine.store("cart").addingItemIds.push(this.productId);
      }

      this.listenAddedToCart(formData);

      this.isLoadingCart = true;
      fetch(formEl.action, {
        method: formEl.method,
        body: formData,
      })
        .then((result) => {
          return result.text();
        })
        .then((content) => {
          window.hyva.replaceDomElement("#cart-button", content);
          Alpine.nextTick(() => {
            if (Alpine.store('cart').productCartErrorMessage.length) {
              Alpine.store('popup').__updatePopupHeight(this.productActionsPopup)
            } else {
              this.hideProductActions();
            }
          })
        })
        .catch((error) => console.error("Error:", error))
        .finally(() => {
          Alpine.store("cart").addingItemIds = Alpine.store(
            "cart",
          ).addingItemIds.filter((itemId) => itemId !== this.productId);
          this.isLoadingCart = false;
        });
    },

    listenAddedToCart(formData) {
      window.addEventListener(
        "private-content-loaded",
        (event: any) => {
          const { cart: { items = [] } = {} } = event.detail.data || {};

          // Grouped products
          if (this.groupedIds.length) {
            const groupedIdsWithQty = this.groupedIds.filter(groupId => {
              const quantity = formData.get(`super_group[${groupId}]`);
              return parseInt(<string>quantity) > 0;
            });

            const itemIds = groupedIdsWithQty
              .map(
                (id) =>
                  items.find((item: CartItem) => item.product_id === id)
                    ?.item_id,
              )
              .filter((id) => !!id);

            if (itemIds.length) {
              setTimeout(() => Alpine.store("cart").focusInCart(itemIds), 200);
            }
            return;
          }

          // Non grouped products
          const item = items.find((item: CartItem) =>
            this.checkIsItemInCart(item),
          );

          if (item) {
            setTimeout(
              () => Alpine.store("cart").focusInCart(item.item_id),
              200,
            );
          }
        },
        { once: true },
      );
    },

    showProductActions() {
      this.$store.popup.showPopup(this.productActionsPopup, true);
    },

    hideProductActions() {
      this._handleStickyProductActionsClosure();
      this.$store.popup.hidePopup(this.productActionsPopup);
    },

    _handleStickyProductActionsClosure() {
      // account for the sticky product actions visibility
      const el = document.getElementById(
        "product-actions",
      ) as withXAttributes<HTMLElement>;

      if (el && el._x_visible) {
        this.$store.popup.__popupHistory =
          this.$store.popup.__popupHistory.filter((p: string) => {
            return p !== POPUP_BOTTOM_ACTIONS;
          });
      }
    },

    quickBuy() {
      this.productActionsPopup = "quick-buy-" + this.productId;
      this.showProductActions();
    },

    scrollToTop() {
      if (typeof this.scrollToPreviewTop !== "undefined") {
        this.scrollToPreviewTop()
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },

    changeOption(attributeId: number, value: string) {

      // reset error message
      if (Alpine.store('cart').productCartErrorMessage.length) {
        Alpine.store('cart').setProductCartErrorMessage('');

        Alpine.nextTick(() => {
          Alpine.store('popup').__updatePopupHeight(this.productActionsPopup);
        });
      }

      if (value === "") {
        this.selectedValues = this.removeAttrFromSelection(
          this.selectedValues,
          attributeId,
        );
      } else if (
        value &&
        this.getAllowedAttributeOptions(attributeId).find(
          (option) => option.id === value,
        )
      ) {
        // Only set as selected value if it is valid
        this.selectedValues[attributeId] = value;
      }
      this.findSimpleIndex();
      this.findAllowedAttributeOptions();
      this.updatePrices();
      this.updateGallery();
      window.dispatchEvent(
        new CustomEvent("configurable-selection-changed", {
          detail: {
            productId: this.productId,
            optionId: attributeId,
            value: value,
            productIndex: this.productIndex,
            selectedValues: this.selectedValues,
            candidates: this.findProductIdsForPartialSelection(
              this.selectedValues,
            ),
          },
        }),
      );

      // Update cart state
      this._updateSelectedVariantCartState();
    },

    initAttributes(swatchConfig, optionConfig) {
      this.swatchConfig = swatchConfig;
      this.optionConfig = optionConfig;

      this.findAllowedAttributeOptions();
      this.$nextTick(() => {
        if (typeof this.optionConfig!.defaultValues === "object") {
          for (const [attributeId, value] of Object.entries(
            this.optionConfig!.defaultValues,
          )) {
            this.changeOption(parseInt(attributeId), value + "");
          }
        }
      });
    },

    optionIsEnabled(attributeId, optionId) {
      // return true if a product with this option is enabled
      for (const productId in this.optionConfig!.index) {
        if (this.optionConfig!.index[productId][attributeId] === optionId) {
          return true;
        }
      }
      return false;
    },
    getSwatchBackgroundStyle(attributeId, optionId, modifyOpacity) {
      const config = this.getSwatchConfig(
        attributeId,
        optionId,
      ) as AttributeOption;
      const type = this.getSwatchType(attributeId, optionId);

      let opacity = "";
      if (modifyOpacity && this.selectedValues[attributeId] === optionId) {
        opacity = "95";
      }

      if (type === "color") {
        return `background-color: ${config.value}${opacity}`;
      } else if (type === "image") {
        return `background: #ffffff${opacity} url('${config.value}') no-repeat center`;
      } else {
        return "";
      }
    },
    optionIsActive(attributeId, optionId) {
      // return true if a product with this option is in stock
      return !!this.getAllowedAttributeOptions(attributeId).find(
        (option) => option.id === optionId,
      );
    },
    getAllowedAttributeOptions(attributeId) {
      return this.allowedAttributeOptions[attributeId] || [];
    },

    findAllowedAttributeOptions() {
      // a better method name would be `updateAllowedAttributeOptions` but keeping for bc
      this.allowedAttributeOptions = this.calculateAllowedAttributeOptions(
        this.selectedValues,
      );
    },

    calculateAllowedAttributeOptions(selectedValues) {
      const allAttributes = this.optionConfig!.attributes;
      const allAttributesSorted = Object.values(allAttributes).sort((a, b) => {
        return a.position - b.position;
      });

      const newAllowedAttributeOptions: Array<AllowedAttributeOption[]> = [];

      allAttributesSorted.forEach((attribute) => {
        const selectionWithoutAttr = Object.assign(
          {},
          this.removeAttrFromSelection(selectedValues, attribute.id),
        );

        const availableIndexes =
          this.calculateAvailableProductIndexes(selectionWithoutAttr);

        newAllowedAttributeOptions[attribute.id] = allAttributes[
          attribute.id
          ].options.filter((option: Record<string, any>) => {
          return !!option.products.find((product: string) => {
            return availableIndexes.includes(product);
          });
        });
      });
      return newAllowedAttributeOptions;
    },

    removeAttrFromSelection(selectedValues, attributeId) {
      // create new array so the length property is reset if no option is selected (avoiding delete)
      const id = parseInt("" + attributeId);
      return selectedValues.reduce((newSelection: string[], val, attr) => {
        if (attr !== id) {
          newSelection[attr] = val;
        }
        return newSelection;
      }, []);
    },

    calculateAvailableProductIndexes(selectedOptions) {
      if (Object.keys(selectedOptions).length === 0) {
        // for Magento >= 2.4.4 when out-of-stock products are shown
        if (Object.values(this.optionConfig!.salable || {}).length) {
          // The object this.optionConfig!.salable is a map {attrId: {optionId: [productIndexes]}}
          // This turns the objects into arrays and flattens them, and removes duplicates
          // avoiding Array.flat and Set because they don't quite make our coverage requirement on caniuse.com.
          // This ends up returning an array of salable product indexes.
          return [].concat
            .apply(
              [],
              [].concat.apply(
                [],
                // @ts-ignore
                Object.values(this.optionConfig!.salable).map(Object.values),
              ),
            )
            .filter((x, i, a) => a.indexOf(x) === i);
        }
        // no selected options mean all products are available for selection
        return Object.keys(this.optionConfig!.index);
      }

      // when cataloginventory/options/show_out_of_stock is set, this.optionConfig!.index contains
      // out of stock products. Since 2.4.4 this.optionConfig!.salable was introduced, which reflects
      // the actual salable state of a product, but only if the option is set, otherwise it is an empty object.
      // So if this.optionConfig!.salable is available, it should be used.
      // Otherwise, the code checks which products match the given current selection as it was for older
      // Magento versions, but then options of out of stock products are shown if the config option is set.
      const selectedIds = Object.keys(selectedOptions);
      if (Object.values(this.optionConfig!.salable || {}).length) {
        // for Magento >= 2.4.4 when out-of-stock products are shown:
        const selectedOptionIndexes = selectedIds.map((attrId: any) => {
          const optionValue = selectedOptions[attrId];
          return (
            (this.optionConfig!.salable[attrId] &&
              this.optionConfig!.salable[attrId][optionValue]) ||
            []
          );
        });
        // intersection of optionIndexes
        return selectedOptionIndexes.reduce((acc, optionIndexes) => {
          return acc.filter((index: any) => optionIndexes.includes(index));
        });
      } else {
        // for Magento < 2.4.4 or when out-of-stock-products are hidden:
        const productIndexes = this.optionConfig!.index;
        return Object.keys(productIndexes).filter((index) => {
          // selectedIds.every() doesn't have enough browser support at the time of writing according to https://caniuse.com/mdn-javascript_builtins_array_every
          for (const attrId of selectedIds) {
            if (
              productIndexes[index][attrId] !==
              `${selectedOptions[attrId as any]}`
            )
              return false;
          }
          return true;
        });
      }
    },

    isTextSwatch(attributeId, optionId) {
      return this.getSwatchType(attributeId, optionId) === "text";
    },

    getSwatchConfig(attributeId, optionId) {
      return this.swatchConfig[attributeId] &&
      this.swatchConfig[attributeId][optionId]
        ? this.swatchConfig[attributeId][optionId]
        : false;
    },

    getSwatchType(attributeId, optionId) {
      // Deserialize the attribute details the first time they are used
      if (
        this.swatchConfig[attributeId] &&
        !this.swatchConfig[attributeId].details
      ) {
        this.swatchConfig[attributeId] =
          this.getAttributeSwatchData(attributeId);
      }
      const type =
        (this.swatchConfig[attributeId] &&
          this.swatchConfig[attributeId].details &&
          this.swatchConfig[attributeId].details.swatch_input_type) ||
        "empty";
      return type === "visual"
        ? this.getVisualSwatchType(attributeId, optionId)
        : type;
    },
    getAttributeSwatchData(attributeId) {
      const swatchConfig = Object.assign({}, this.swatchConfig[attributeId]);
      swatchConfig["details"] = JSON.parse(swatchConfig["additional_data"]);

      return swatchConfig;
    },
    getSwatchText(attributeId, optionId) {
      const config = this.getSwatchConfig(
        attributeId,
        optionId,
      ) as AttributeOption;
      return (
        config.label ||
        config.value ||
        this.getOptionLabelFromOptionConfig(attributeId, optionId)
      );
    },
    getOptionLabelFromOptionConfig(attributeId, optionId) {
      // Fallback if no value is present in swatchConfig data
      // Reference issue https://gitlab.hyva.io/hyva-themes/magento2-default-theme/-/issues/190
      const option = this.getAllAttributeOptions(attributeId).filter(
        (option) => option.id === optionId,
      );
      return (option && option[0] && option[0].label) || "";
    },

    getAllAttributeOptions(attributeId) {
      return (
        (this.optionConfig!.attributes[attributeId] &&
          this.optionConfig!.attributes[attributeId].options) ||
        []
      );
    },

    getTruncatedAttributeOptions(attributeId) {
      const attributeOptions = this.getAllAttributeOptions(attributeId);

      return attributeOptions.length > TRUNCATED_ATTRIBUTE_OPTIONS_MAX_NUMBER
        ? attributeOptions.slice(0, TRUNCATED_ATTRIBUTE_OPTIONS_MAX_NUMBER)
        : attributeOptions;
    },

    getMoreAttributeOptionsText(attributeId) {
      const attributeOptions = this.getAllAttributeOptions(attributeId);

      if (attributeOptions.length > TRUNCATED_ATTRIBUTE_OPTIONS_MAX_NUMBER) {
        return `+${attributeOptions.length - TRUNCATED_ATTRIBUTE_OPTIONS_MAX_NUMBER}`;
      }

      return "";
    },

    getVisualSwatchType(attributeId, targetOptionId) {
      // If a type configuration is present for the given option id, use it
      const config = this.swatchConfig[attributeId];
      if (
        config[targetOptionId] &&
        typeof config[targetOptionId].type !== "undefined"
      ) {
        return this.mapSwatchTypeNumberToTypeCode(config[targetOptionId].type);
      }

      // Otherwise - if no config is present for the target option - use the type of the first option
      // with a type property from the attribute, thus assuming it's the same type as the target option.
      // (This edge case condition can occur on single swatch products if some options are not salable)
      return this.getTypeOfFirstOption(attributeId);
    },

    getTypeOfFirstOption(attributeId) {
      for (const optionId in this.swatchConfig[attributeId]) {
        const option = this.swatchConfig[attributeId][optionId];
        if (typeof option.type !== "undefined") {
          return this.mapSwatchTypeNumberToTypeCode(option.type);
        }
      }
    },

    mapSwatchTypeNumberToTypeCode(typeNumber) {
      switch ("" + typeNumber) {
        case "1":
          return "color";
        case "2":
          return "image";
        case "3":
          return "empty";
        case "0":
        default:
          return "text";
      }
    },

    findProductIdsForPartialSelection(optionSelection) {
      const candidateProducts = Object.values(optionSelection).reduce(
        (candidates: any, optionId) => {
          const newCandidates = this.getProductIdsForOption({ id: optionId });
          return candidates === null
            ? newCandidates
            : candidates.filter((productId: string) =>
              newCandidates.includes(productId),
            );
        },
        null,
      );
      return candidateProducts || [];
    },
    getProductIdsForOption(option) {
      const attributeId = this.findAttributeByOptionId(option.id);
      const allOptions = this.optionConfig!.attributes[attributeId!];
      const opt = ((allOptions && allOptions.options) || []).find(
        (o: Record<string, any>) => o.id === option.id,
      );
      return opt && opt.products ? opt.products : [];
    },

    findAttributeByOptionId(optionId) {
      for (const attributeId in this.optionConfig!.attributes) {
        const attributeOptions =
          this.optionConfig!.attributes[attributeId].options || [];
        if (
          attributeOptions.find(
            (option: Record<string, any>) => option.id === optionId,
          )
        ) {
          return attributeId;
        }
      }
    },

    findSimpleIndex() {
      // a better method name would be `updateSelectedSimpleIndex` but keeping for bc
      this.productIndex = this.calculateSimpleIndexForPartialSelection(
        this.selectedValues,
      );
    },

    calculateSimpleIndexForPartialSelection(selectedValues) {
      if (selectedValues.length === 0) return 0;
      let productIndexIds = Object.keys(this.optionConfig!.index);
      Object.keys(this.optionConfig!.attributes).forEach((attribute: any) => {
        // for each attribute, check if a value is selected for the attribute
        // if it is, filter all products to only include those that match the selected attribute value
        const productsWithAttributeMatch = selectedValues[attribute]
          ? productIndexIds.filter((productIndex) => {
            return (
              this.optionConfig!.index[productIndex][attribute] ===
              this.selectedValues[attribute]
            );
          })
          : [];

        // if we found matches, only keep the ones that match, otherwise, keep all products
        productIndexIds = productsWithAttributeMatch.length
          ? productsWithAttributeMatch
          : productIndexIds;
      });
      return productIndexIds[0];
    },

    updatePrices() {
      const value = this.productIndex
        ? this.optionConfig!.optionPrices[this.productIndex]
        : this.optionConfig!.prices;
      window.dispatchEvent(
        new CustomEvent("update-prices-" + this.productId, {
          detail: Object.assign(value, {
            isMinimalPrice: this.calculateIsMinimalPrice(),
          }),
        }),
      );
    },
    calculateIsMinimalPrice() {
      return (
        this.selectedValues.filter((value) => !!value).length <
        Object.keys(this.optionConfig!.attributes).length
      );
    },
    updateGallery() {
      if (this.productIndex) {
        const images = this.optionConfig!.images[this.productIndex];
        images &&
        window.dispatchEvent(
          new CustomEvent("update-gallery", {
            detail: {
              images: this.sortImagesByPosition(images),
              productId: this.productId
            },
          }),
        );
      } else {
        window.dispatchEvent(new CustomEvent("reset-gallery", {
          detail: {
            productId: this.productId
          }
        }));
      }
    },
    sortImagesByPosition(images) {
      return images.sort((x, y) => {
        return x.position === y.position
          ? 0
          : parseInt(x.position) > parseInt(y.position)
            ? 1
            : -1;
      });
    },
  };
