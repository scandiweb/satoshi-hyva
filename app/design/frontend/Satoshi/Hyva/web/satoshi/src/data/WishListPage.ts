import { Magics } from "alpinejs";
import { CartItem } from "../store/Cart.ts";

export type WishListPageType = {
  actionBtnText: string;
  addToCart(itemId: string, postParams: any, productId: string): Promise<void>;
  addAllItemsToCart(): Promise<void>;
  focusOnCartAddedItems(addedProductSkus: string[]): void;
  setActionBtnText(text?: string): void;
  postForm(postParams: any): Promise<void>;
} & Magics<{}>;

export const WishListPage = (
  urlParams: { action: string, data: any },
) =>
  <WishListPageType>{
    actionBtnText: '',

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

    setActionBtnText(text) {
      this.actionBtnText = text || '';
    },
  };
