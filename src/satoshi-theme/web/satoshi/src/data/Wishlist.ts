import { Magics } from "alpinejs";
import { CartItem } from "../store/Cart.ts";
import { replaceMainContentWithTransition } from "../plugins/Transition";

export type WishlistType = {
  actionBtnText: string;

  isLoading: boolean;
  wishlistProducts: null | Record<string, any>;
  itemCount: number;
  wishlistCountLabel: null | string;
  wishlistItems: Record<string, any>;

  addToCart(itemId: string, postParams: any, productId: string): Promise<void>;
  addAllItemsToCart(): Promise<void>;
  focusOnCartAddedItems(addedProductSkus: string[]): void;
  setActionBtnText(text?: string): void;
  postForm(postParams: any): Promise<void>;

  wishlistSidebarFetchHandler(body: string, postUrl: string): Promise<void>;
  receiveWishlistData(data: Record<string, any>): void;
  addToCartFromWishlistSidebar(json: string, productSku: string): Promise<void>;
  removeFromWishlistSidebar(json: string): void;
} & Magics<{}>;

export const Wishlist = (
  urlParams: { action: string, data: any },
) =>
  <WishlistType>{
    actionBtnText: '',
    isLoading: false,
    wishlistProducts: null,
    itemCount: 0,
    wishlistCountLabel: null,
    wishlistItems: {},

    async addToCart(itemId, postParams, productSku) {
      const qtyInput = this.$refs[`product-qty-${itemId}`] as HTMLInputElement | null;
      postParams.data.qty = qtyInput?.value ?? postParams.data.qty;

      await this.postForm(postParams);
      this.focusOnCartAddedItems([productSku]);
      this.setActionBtnText();
    },

    async addAllItemsToCart() {
      let separator = urlParams.action.indexOf('?') >= 0 ? '&' : '?';
      const addedProductSkus = [] as string[];

      document.querySelectorAll('input[name^=qty]').forEach((inputElement) => {
        const input = inputElement as HTMLInputElement;
        urlParams.action += separator + input.name + '=' + encodeURIComponent(input.value);
        separator = '&';

        const productSku = input.getAttribute('data-product-sku') as string;
        if (productSku) {
          addedProductSkus.push(productSku);
        }
      });

      await this.postForm(urlParams);
      this.focusOnCartAddedItems(addedProductSkus);
      this.setActionBtnText();
    },

    focusOnCartAddedItems(addedProductSkus = [] as string[]) {
      if (!addedProductSkus.length) return;

      window.addEventListener(
        "private-content-loaded",
        () => {
          const cartItems = Alpine.store("cart").cartItems;

          const itemIds = cartItems
            .filter((item: CartItem) => addedProductSkus.includes(item.product_sku))
            .map((item) => item.item_id);

          if (itemIds.length) {
            setTimeout(
              () => Alpine.store("cart").focusInCart(itemIds),
              200,
            );
          }
        },
        {once: true},
      );
    },

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
        const wishlistProducts = {...data['wishlist']};
        wishlistProducts.items = wishlistProducts.items.slice(0, SIDEBAR_ITEMS_NUMBER);

        this.wishlistProducts = wishlistProducts;
        this.wishlistCountLabel = this.wishlistProducts?.counter;
        this.itemCount = this.wishlistProducts?.items.length;
        this.wishlistItems = this.wishlistProducts?.items;
      }
    },

    async addToCartFromWishlistSidebar(json, productSku) {
      const obj = JSON.parse(json);
      const postUrl = obj.action;
      const body = "form_key=" + window.hyva.getFormKey() + "&item=" + obj.data.item + "&qty=" + obj.data.qty + "&uenc=" + window.hyva.getUenc();

      await this.wishlistSidebarFetchHandler(body, postUrl);
      this.focusOnCartAddedItems([productSku]);
    },

    removeFromWishlistSidebar(json) {
      const obj = JSON.parse(json);
      const postUrl = obj.action;
      const body = "form_key=" + window.hyva.getFormKey() + "&item=" + obj.data.item + "&uenc=" + window.hyva.getUenc();

      this.wishlistSidebarFetchHandler(body, postUrl);
    },
  };
