import { withXAttributes } from "alpinejs";
import { POPUP_OVERLAY_CLICK_EVENT } from "../store/Popup";
import { CartItem } from "../store/Cart";

export type ProductPageType = {
  [key: string | symbol]: any;

  variantQty: number;
  isVariantInCart: boolean;
  productActionsPopup: string;
  selectedOptions: string[];
  productId: string;
  contentId: string;
  isScrollingToTop: boolean;
  cartItemKey: string | undefined;
  readonly isProductBeingRemoved: boolean;
  readonly isProductBeingAdded: boolean;

  selectOption(optionIndex: number, optionValue: string): void;

  checkIsItemInCart(item: CartItem): boolean;
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
};

export interface ProductPageProps {
  productId: string;
  isScrollingToTop?: Boolean;
}

const POPUP_BOTTOM_ACTIONS = "product_bottom_actions";

export const ProductPage = () =>
  <ProductPageType>{
    isVariantInCart: false,
    variantQty: 1,
    selectedOptions: [],
    productId: "",
    contentId: "product-page",
    isScrollingToTop: true,
    cartItemKey: undefined,
    productActionsPopup: "product_actions",

    setProductPageProps({ productId, isScrollingToTop = false }) {
      this.productId = productId;
      this.productActionsPopup += `-${productId}`;
      this.isScrollingToTop = !!isScrollingToTop;

      this._updateSelectedVariantCartState();
    },

    get isProductBeingRemoved() {
      return Alpine.store("cart").removingItemId === this.cartItemKey;
    },

    get isProductBeingAdded() {
      // TODO: Also check selected options
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
      if (item.item_id !== this.productId) {
        return false;
      }

      // TODO: Match options

      // Item found
      return true;
    },

    async selectOption(optionIndex: number, optionValue: string) {
      this.selectedOptions[optionIndex] = optionValue;

      // TODO: display selected option images

      this._updateSelectedVariantCartState();

      if (this.isScrollingToTop) {
        this.scrollToTop();
      }
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
      this.variantQty -= 1;
      Alpine.store("cart").decreaseQty(this.cartItemKey!);
    },

    increaseQty() {
      this.variantQty += 1;
      Alpine.store("cart").increaseQty(this.cartItemKey!);
    },

    setQuantity(quantity) {
      this.variantQty = Math.max(0, Number(quantity));
      Alpine.store("cart").setQty(quantity, this.cartItemKey!);
    },

    addToCart() {
      this.hideProductActions();
      // TODO: Refactor add to cart
      this.$store.cart.addToCart({
        id: this.productId,
        quantity: this.variantQty,
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
  };
