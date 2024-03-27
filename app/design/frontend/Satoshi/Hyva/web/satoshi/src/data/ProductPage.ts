import { MainStoreType } from "../store/Main";
import { POPUP_APPEARANCE_DURATION } from "../store/Popup";

export type ProductPageType = {
  isLargerThan375: boolean;
  isInWishlist: boolean;
  isProductInCart: boolean;
  selectedVariantId: number;
  qty: number;
  isTopActionsHidden: boolean;
  isProductActionsPopup: boolean;

  init(): void;
  addToCart(): void;
  setSelectedVariantId(id: number): void;
  handleActionsPopup(show: boolean): void;
  decreaseQty(quantity: number): void;
  increaseQty(quantity: number): void;
  setQuantity(quantity: number): void;
  updateCartItem(): void;
  showProductActions(): void;
} & MainStoreType;

export interface PdpProps {
  selectedVariantId: number;
  selectedOrFirstVariantId: number;
  hasOnlyDefaultVariant: boolean;
  firstAvailableVariantId: number;
  isProductInCart: boolean;
  quantity: number;
}

const POPUP_BOTTOM_ACTIONS = "product_bottom_actions";
const POPUP_PRODUCT_ACTIONS = "product_actions";

export const ProductPage = ({
  selectedVariantId,
  selectedOrFirstVariantId,
  hasOnlyDefaultVariant,
  firstAvailableVariantId,
  isProductInCart,
  quantity,
}: PdpProps | any) =>
  <ProductPageType>{
    isLargerThan375: window.matchMedia("(min-width: 375px)").matches,
    qty: quantity || 1,
    isInWishlist: false,
    isProductInCart: isProductInCart || false,
    selectedVariantId: 0,
    isTopActionsHidden: false,
    isProductActionsPopup: false,

    init() {
      window
        .matchMedia("(min-width: 375px)")
        .addEventListener("change", (event) => {
          this.isLargerThan375 = event.matches;
        });

      // Set preselected variant
      if (selectedVariantId != 0) {
        this.setSelectedVariantId(selectedVariantId);
      } else if (hasOnlyDefaultVariant) {
        this.setSelectedVariantId(selectedOrFirstVariantId);
      }
    },

    addToCart() {
      const formData = {
        items: [
          {
            id: this.selectedVariantId,
            quantity: this.qty,
          },
        ],
      };

      fetch(`${window.Shopify.routes.root}cart/add.js`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => {
          if (this.isTopActionsHidden) {
            this.$store.popup.hideAllPopups();
            this.isProductInCart = true;

            setTimeout(() => {
              this.$store.popup.showPopup(POPUP_BOTTOM_ACTIONS);
            }, POPUP_APPEARANCE_DURATION);
          } else {
            this.$store.popup.hideAllPopups();
            this.isProductInCart = true;
          }
          return response.json();
        })
        .then(() => {
          this.totalCartQty += this.qty;
          Alpine.store("main").totalCartQty = this.totalCartQty;
        })
        .catch((error) => console.error("Error:", error));
    },

    setSelectedVariantId(id) {
      if (id != 0) {
        this.selectedVariantId = id;

        history.replaceState(
          history.state,
          "",
          `?variant=${this.selectedVariantId}`
        );
        return;
      }

      if (hasOnlyDefaultVariant) {
        this.selectedVariantId = firstAvailableVariantId;
      } else {
        this.selectedVariantId = id;
      }

      let url = new URL(window.location.href);
      url.searchParams.delete("variant");
      window.history.replaceState(
        history.state,
        document.title,
        url.toString()
      );
    },

    handleActionsPopup(show) {
      if (this.$store.popup.currentPopup == "menu") {
        return;
      }

      if (!show) {
        this.$store.popup.hideAllPopups();
        // Waiting 100ms to allow popup close before button resizes
        setTimeout(() => {
          this.isTopActionsHidden = false;
        }, 100);
        return;
      } else {
        this.isTopActionsHidden = true;
        this.$store.popup.showPopup(POPUP_BOTTOM_ACTIONS, true);
      }
    },

    decreaseQty(quantity) {
      this.qty -= +quantity;
      this.updateCartItem();
    },

    increaseQty(quantity) {
      this.qty += +quantity;
      this.updateCartItem();
    },

    setQuantity(quantity) {
      if (quantity < 0) {
        this.qty = 0;
        this.updateCartItem();
        return;
      }

      this.qty = +quantity;
      this.updateCartItem();
    },

    updateCartItem() {
      let updates = {
        [this.selectedVariantId]: this.qty,
      };

      if (this.qty == 0) {
        // Hide actions hover if hover is active
        if (this.isTopActionsHidden) {
          this.$store.popup.hideCurrentPopup();
        } else {
          // Reset straight away to avoid delay in top actions
          this.isProductInCart = false;
          this.setSelectedVariantId(0);
        }

        setTimeout(() => {
          // Reset after popup is closed
          this.isProductInCart = false;
          this.setSelectedVariantId(0);
          this.qty = 1;

          if (this.isTopActionsHidden) {
            this.$store.popup.showPopup(POPUP_BOTTOM_ACTIONS, true);
          }
        }, POPUP_APPEARANCE_DURATION);
      }

      fetch(`${window.Shopify.routes.root}cart/update.js`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      })
        .then((response) => response.json())
        .then((response) => {
          this.totalCartQty = response.item_count || 0;
          Alpine.store("main").totalCartQty = this.totalCartQty;
        })
        .catch((error) => console.error("Error:", error));
    },

    showProductActions() {
      this.$store.popup.showPopup(POPUP_PRODUCT_ACTIONS);
    },
  };
