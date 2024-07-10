import { withXAttributes } from "alpinejs";
import { fetchPage, replaceContent } from "../plugins/Transition";
import nProgress from "nprogress";
import { POPUP_OVERLAY_CLICK_EVENT } from "../store/Popup";
import { CartItem, GiftProps } from "../store/Cart";

const initialGiftProperties = {
  __shopify_send_gift_card_to_recipient: false,
  "Recipient email": null,
  "Recipient name": null,
  Message: null,
  "Send on": null,
};

export type ProductPageType = {
  [key: string | symbol]: any;

  variantQty: number;
  isVariantInCart: boolean;
  productUrl: string;
  sectionId: string | null;
  _formRef: HTMLFormElement | null;
  _mutationObserver: MutationObserver | null;
  productActionsPopup: string;

  isVariantManuallySelected?: boolean;
  selectedOptions?: string[];
  selectedVariantId?: number;
  productId?: number;
  XRMediaModels: Record<string, any>[];
  properties: GiftProps;
  cartItemKey: string | undefined;
  readonly isProductBeingRemoved: boolean;
  readonly isProductBeingAdded: boolean;

  selectOptionAndSetVariantId(
    optionIndex: number,
    optionValue: string,
    id: number,
  ): void;

  checkIsItemInCart(item: CartItem): boolean;
  setupShopifyXR(): void;
  setupXRElements(errors?: any): void;
  toggleStickyProductActions(show: boolean): void;
  showProductActions(): void;
  quickBuy(): void;
  hideProductActions(): void;

  decreaseQty(): void;
  increaseQty(): void;
  setQuantity(quantity: number): void;
  addToCart(): void;

  scrollToTop(): void;

  setProductPageProps(props: ProductPageProps): void;

  fetchProductRecommendations(id: string, url: string): void;
};

export interface ProductPageProps {
  manuallySelectedVariantId: number;
  selectedVariantId: number;
  selectedOptions: string[];
  productUrl: string;
  sectionId?: string;
  isSyncedWithUrl?: Boolean;
  isScrollingToTop?: Boolean;
  productId: number;
  contentId: string;
  XRMediaModels: Record<string, any>[];
  variantsCount: number | null;
}

const POPUP_BOTTOM_ACTIONS = "product_bottom_actions";

export const ProductPage = () =>
  <ProductPageType>{
    isVariantInCart: false,
    variantQty: 1,
    selectedVariantId: undefined,
    selectedOptions: [],
    manuallySelectedVariantId: undefined,
    productId: undefined,
    contentId: "product-page",
    isSyncedWithUrl: true,
    isScrollingToTop: true,
    productUrl: "",
    sectionId: null,
    XRMediaModels: [],
    properties: initialGiftProperties,
    cartItemKey: undefined,
    variantsCount: null,
    _formRef: null,
    _mutationObserver: null,
    productActionsPopup: "product_actions",

    setProductPageProps({
      manuallySelectedVariantId,
      selectedVariantId,
      selectedOptions,
      productId,
      productUrl,
      isSyncedWithUrl = false,
      isScrollingToTop = false,
      sectionId = null,
      XRMediaModels = [],
      variantsCount = null,
    }) {
      this.isVariantManuallySelected = !!manuallySelectedVariantId;
      this.selectedVariantId = selectedVariantId;
      this.selectedOptions = selectedOptions;
      this.productId = productId;
      this.productActionsPopup += `-${productId}`;
      this.productUrl = productUrl;
      this.isSyncedWithUrl = isSyncedWithUrl;
      this.isScrollingToTop = isScrollingToTop;
      this.sectionId = sectionId;
      this.XRMediaModels = XRMediaModels;
      this.variantsCount = variantsCount;

      if (sectionId) {
        this.productActionsPopup += `-${sectionId}`;
      }

      this._updateSelectedVariantCartState();
      if (this.XRMediaModels.length) {
        this.setupShopifyXR();
      }
    },

    get isProductBeingRemoved() {
      return Alpine.store("cart").removingItemKey === this.cartItemKey;
    },

    get isProductBeingAdded() {
      if (this.selectedVariantId) {
        return Alpine.store("cart").addingItemIds.includes(
          this.selectedVariantId,
        );
      } else {
        return false;
      }
    },

    init() {
      // Initialize Dynamic checkout button
      this._formRef = this.$refs.ProductForm;

      this.$watch("$store.cart.cartItems", () => {
        this._updateSelectedVariantCartState();
      });

      this.$watch("properties", () => {
        // Reset when checkbox is unchecked
        if (!this.properties.__shopify_send_gift_card_to_recipient) {
          this.properties = initialGiftProperties;
        }

        this._updateSelectedVariantCartState();
      });

      Alpine.nextTick(() => {
        if (!this._formRef) {
          return;
        }

        this._mutationObserver = new MutationObserver((mutationList) => {
          for (const mutation of mutationList) {
            if (mutation.type === "childList") {
              this._updateSelectedVariantCartState();
              return;
            }

            if (
              mutation.target.nodeName === "INPUT" &&
              (mutation.target as HTMLInputElement).name === "selling_plan"
            ) {
              this._updateSelectedVariantCartState();
            }
          }
        });

        this._mutationObserver!.observe(this._formRef, {
          attributeFilter: ["value"],
          subtree: true,
          childList: true,
        });
      });

      document.addEventListener(POPUP_OVERLAY_CLICK_EVENT, () => {
        if (this.$store.popup.currentPopup === this.productActionsPopup) {
          this._handleStickyProductActionsClosure();
        }
      });
    },

    setupShopifyXR() {
      window.Shopify.loadFeatures([
        {
          name: "shopify-xr",
          version: "1.0",
          onLoad: this.setupXRElements.bind(this),
        },
      ]);
    },

    setupXRElements(errors?: any) {
      if (errors) return;

      if (!window.ShopifyXR) {
        document.addEventListener("shopify_xr_initialized", () => {
          this.setupXRElements();
        });
        return;
      }

      window.ShopifyXR.addModels(this.XRMediaModels);
      window.ShopifyXR.setupXRElements();
    },

    _updateSelectedVariantCartState() {
      if (!this.selectedVariantId) {
        return;
      }

      const cartItem = Alpine.store("cart").cartItems.find(
        this.checkIsItemInCart.bind(this),
      );

      this.isVariantInCart = !!cartItem;
      this.variantQty = cartItem?.quantity || 1;
      this.cartItemKey = cartItem?.key;
    },

    checkIsItemInCart(item: CartItem) {
      // Skip deleted items
      if (item.isDeleted) {
        return false;
      }

      // Match variant id
      if (item.id !== this.selectedVariantId) {
        return false;
      }

      // Check selling plan
      const selling_plan = this._formRef?.querySelector(
        "input[name=selling_plan]",
      ) as HTMLInputElement | null;

      if (
        Number(selling_plan?.value || null) !==
        Number(item.selling_plan_allocation?.selling_plan.id || null)
      ) {
        return false;
      }

      const isDifferentRecipient = Object.keys(this.properties).some((key) => {
        const value = this.properties[key as keyof GiftProps];
        const valueToCheck = value === "" ? null : value;
        const itemProps = Object.keys(item.properties).length
          ? item.properties
          : initialGiftProperties;

        return itemProps[key as keyof GiftProps] !== valueToCheck;
      });

      // Match gift recipient
      if (isDifferentRecipient) {
        return false;
      }

      // Item found
      return true;
    },

    async selectOptionAndSetVariantId(
      optionIndex: number,
      optionValue: string,
      variantId: number,
    ) {
      if (!this.selectedOptions) {
        return;
      }

      this.selectedOptions[optionIndex] = optionValue;

      this.isVariantManuallySelected = true;
      this.selectedVariantId = variantId;

      this._updateSelectedVariantCartState();

      if (this.variantsCount == 1) {
        return;
      }

      // TODO: only request product section
      const nextUrl = new URL(this.productUrl, document.baseURI);
      nextUrl.searchParams.set("variant", variantId.toString());
      if (this.sectionId) {
        nextUrl.searchParams.set("section_id", this.sectionId);
      }

      nProgress.start();

      const nextPage = fetchPage(nextUrl.href);
      const html = await nextPage;
      const wrapper = document.getElementById(
        this.sectionId || this.contentId,
      )!;
      wrapper.classList.add("disable-fade");

      replaceContent(
        html,
        this.sectionId || `${this.contentId}-content`,
        wrapper,
      );

      if (this.isSyncedWithUrl) {
        history.replaceState(history.state, "", nextUrl.href);
      }

      if (this.isScrollingToTop) {
        this.scrollToTop();
      }

      // Initialize Dynamic checkout button
      nProgress.done();
    },

    toggleStickyProductActions(show) {
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
      if (!this.selectedVariantId) {
        return;
      }

      this.variantQty -= 1;

      Alpine.store("cart").decreaseQty(this.cartItemKey!);
    },

    increaseQty() {
      if (!this.selectedVariantId) {
        return;
      }

      this.variantQty += 1;

      Alpine.store("cart").increaseQty(this.cartItemKey!);
    },

    setQuantity(quantity) {
      if (!this.selectedVariantId) {
        return;
      }

      this.variantQty = Math.max(0, Number(quantity));

      Alpine.store("cart").setQty(quantity, this.cartItemKey!);
    },

    addToCart() {
      if (!this.selectedVariantId) {
        return;
      }

      // Include any extra form data. ie: selling_plan
      const formData = new FormData(this._formRef!);
      const formProps = Object.fromEntries(formData);

      this.hideProductActions();
      this.$store.cart.addToCart({
        ...formProps,
        id: this.selectedVariantId,
        quantity: this.variantQty,
        properties: this.properties,
      });
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

    showProductActions() {
      this.$store.popup.showPopup(this.productActionsPopup, true);
    },

    quickBuy() {
      this.contentId = "product-options";
      this.showProductActions();
    },

    scrollToTop() {
      if (typeof this.scrollToPreviewTop !== "undefined") {
        this.scrollToPreviewTop();
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },

    async fetchProductRecommendations(id, url) {
      const nextPage = fetchPage(url);
      const text = await nextPage;
      const html = document.createElement("div");
      html.innerHTML = text;

      const fallback = html.querySelector(`#${id}`);
      const wrapper = document.querySelector(`#${id}-wrapper`);

      // Remove section if responds with placeholder
      if (fallback) {
        wrapper!.remove();
        return;
      }

      const content = html.querySelector(`#${id}-wrapper`);
      wrapper!.innerHTML = content?.innerHTML!;
    },
  };
