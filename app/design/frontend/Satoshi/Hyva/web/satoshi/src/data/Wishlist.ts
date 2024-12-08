import { replaceMainContentWithTransition } from "../plugins/Transition";
import { CartItem } from "../store/Cart.ts";

export type WishlistType = {
  actionBtnText: string;
  isLoading: boolean;
  wishlistProducts: null | Record<string, any>;
  itemCount: number;
  wishlistCountLabel: null | string;
  wishlistItems: Record<string, any>;

  setActionBtnText(text?: string): void;
  wishlistSidebarFetchHandler(body: string, postUrl: string): void;
  receiveWishlistData(data: Record<string, any>): void;
  addToCart(json: string, productSku: string): void;
  removeFromWishlist(json: string): void;
  focusOnCartAddedItems(addedProductSkus: string[]): void;
};

export const Wishlist = () =>
  <WishlistType>{
    actionBtnText: '',
    isLoading: false,
    wishlistProducts: null,
    itemCount: 0,
    wishlistCountLabel: null,
    wishlistItems: {},

    setActionBtnText(text) {
      this.actionBtnText = text || '';
    },

    async wishlistSidebarFetchHandler(body, postUrl) {
      this.isLoading = true;

      await fetch(postUrl, {
        "headers": {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: body,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
      }).then(async (response) => {
        await replaceMainContentWithTransition(response.url, await response.text());
      }).catch(function (error) {
        console.error("Wishlist action failed", error);
      })
        .finally(() => {
          this.isLoading = false;
          this.setActionBtnText();
        });
    },

    receiveWishlistData(data) {
      if (data['wishlist']) {
        // Keep only 3 wishlist items
        const SIDEBAR_ITEMS_NUMBER = 3;
        const wishlistProducts = { ...data['wishlist'] };
        wishlistProducts.items = wishlistProducts.items.slice(0, SIDEBAR_ITEMS_NUMBER);

        this.wishlistProducts = wishlistProducts;
        this.wishlistCountLabel = this.wishlistProducts?.counter;
        this.itemCount = this.wishlistProducts?.items.length;
        this.wishlistItems = this.wishlistProducts?.items;
      }
    },

    async addToCart(json, productSku) {
      const obj = JSON.parse(json);
      const postUrl = obj.action;
      const body = "form_key=" + window.hyva.getFormKey() + "&item=" + obj.data.item + "&qty=" + obj.data.qty + "&uenc=" + window.hyva.getUenc();

      await this.wishlistSidebarFetchHandler(body, postUrl);
      this.focusOnCartAddedItems([productSku]);
    },

    removeFromWishlist(json) {
      const obj = JSON.parse(json);
      const postUrl = obj.action;
      const body = "form_key=" + window.hyva.getFormKey() + "&item=" + obj.data.item+"&uenc=" + window.hyva.getUenc();

      this.wishlistSidebarFetchHandler(body, postUrl);
    },

    focusOnCartAddedItems(addedProductSkus = [] as string[]) {
      if (!addedProductSkus.length) return;

      const cartItems = Alpine.store("cart").cartItems;

      const itemIds = cartItems
        .filter((item: CartItem) => addedProductSkus.includes(item.product_sku))
        .map((item) => item.item_id);

      if (itemIds.length) {
        Alpine.store("cart").focusInCart(itemIds);
      } else {
        Alpine.store("cart").showCart();
      }
    },
  };
