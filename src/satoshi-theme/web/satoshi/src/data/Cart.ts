import { MainStoreType } from "../store/Main";
import { replaceElement } from "../utils/morph";

export type CartType = {
  isTotalsExpanded: boolean;
  isCartPopupVisible: boolean;
  isLoading: boolean;
  isCartEmpty: boolean;
  isRemoveContent: boolean;

  init(): void;
  updateCartItem(id: number, qty: number): void;
} & MainStoreType;

const POPUP_CART_TOTALS = "cart-totals";
const SECTION_MAIN_CART_ITEMS = "main-cart-items";

export const Cart = (...args: unknown[]) => {
  const [isCartEmpty] = args;

  return <CartType>{
    isTotalsExpanded: false,
    isCartPopupVisible: true,
    isLoading: false,
    isCartEmpty: isCartEmpty,
    isRemoveContent: isCartEmpty,

    init() {
      this.$nextTick(() => {
        this.$store.popup.useOnPopupOverlayClick(POPUP_CART_TOTALS, () => {
          this.isTotalsExpanded = false;
        });

        if (this.isCartEmpty) {
          this.$store.popup.hideAllPopups();
        }
      });

      this.$watch("$store.popup.currentPopup", (value: string) => {
        this.isCartPopupVisible = value === POPUP_CART_TOTALS;
      });

      this.$watch("isTotalsExpanded", (value: boolean) => {
        this.$nextTick(() => {
          // setTimeout fixes content height calculations in some cases
          setTimeout(() => {
            this.$store.popup.extendPopupConfig({
              id: POPUP_CART_TOTALS,
              isFocused: value,
            });
            this.$store.popup.updateContentSize();
          }, 50);
        });
      });
    },

    updateCartItem(id, qty) {
      this.isLoading = true;
      fetch(`${window.Shopify.routes.root}cart/update.js`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: {
            [id]: qty,
          },
          sections: SECTION_MAIN_CART_ITEMS,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          const cartItemElem = this.$refs.MainCartItems;
          const resultHtml = document.createElement("div");
          resultHtml.innerHTML = data.sections[SECTION_MAIN_CART_ITEMS];
          const cartItemHtml = resultHtml.querySelector("#MainCartItems");

          this.totalCartQty = data.item_count || 0;
          this.isCartEmpty = this.totalCartQty == 0;

          replaceElement(cartItemElem, cartItemHtml);
        })
        .catch((error) => console.error("Error:", error))
        .finally(() => (this.isLoading = false));
    },
  };
};
