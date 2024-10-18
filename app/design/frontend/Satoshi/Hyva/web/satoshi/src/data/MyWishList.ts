import { Magics } from "alpinejs";

export type MyWishListType = {
  isLoading: boolean;
  addToCart(productId: string, postParams: any): void;
  addAllItemsToCart(): void;
} & Magics<{}>;

export const MyWishList = (
    urlParams: { action: string, data: any },
) =>
    <MyWishListType>{
      isLoading: false,
    addToCart(productId, postParams) {
      const qtyInput = document.querySelector<HTMLInputElement>(`[name="qty[${productId}]"]`);
      postParams.data.qty = qtyInput ? qtyInput.value : postParams.data.qty;

      window.hyva.postForm(postParams);
    },

    addAllItemsToCart() {
      let separator = urlParams.action.indexOf('?') >= 0 ? '&' : '?';

      Array.from(document.querySelectorAll('input[name^=qty]')).map((qty) => {
        const inputElement = qty as HTMLInputElement;
        urlParams.action += separator + inputElement.name + '=' + encodeURIComponent(inputElement.value);
        separator = '&';
      });

      window.hyva.postForm(urlParams);
    },
};
