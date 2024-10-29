import { Magics } from "alpinejs";
import { replaceMainContentWithTransition } from "../plugins/Transition";
import { CartItem } from "../store/Cart.ts";

export type PostParams = {
  action: string;
  data: Record<string, string>;
  skipUenc?: boolean;
};

export type WishListPageType = {
  isLoading: boolean;
  actionBtnText: string;
  addToCart(itemId: string, postParams: any, productId: string): void;
  addAllItemsToCart(): void;
  postFormWithRedirect(postParams: PostParams, addedProductSkus: string[]): void;
  focusOnCartAddedItems(addedProductSkus: string[]): void;
  setActionBtnText(text?: string): void;
  updateWishList(event: Event): void;
} & Magics<{}>;

export const WishListPage = (
    urlParams: { action: string, data: any },
) =>
    <WishListPageType>{
      isLoading: false,
      actionBtnText: '',

      addToCart(itemId, postParams, productSku) {
        const qtyInput = this.$refs[`product-qty-${itemId}`] as HTMLInputElement | null;
        postParams.data.qty = qtyInput?.value ?? postParams.data.qty;

        this.postFormWithRedirect(postParams, [productSku]);
      },

      addAllItemsToCart() {
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

        this.postFormWithRedirect(urlParams, addedProductSkus);
      },

      postFormWithRedirect(postParams, addedProductSkus = [] as string[]) {
        this.isLoading = true;
        const form = document.createElement("form");

        let data = postParams.data;

        if (!postParams.skipUenc && !data.uenc) {
          data.uenc = btoa(window.location.href);
        }
        form.method = "POST";
        form.action = postParams.action;

        Object.keys(postParams.data).map(key => {
          const field = document.createElement("input");
          field.type = 'hidden'
          field.value = postParams.data[key];
          field.name = key;
          form.appendChild(field);
        });

        const form_key = document.createElement("input");
        form_key.type = 'hidden';
        form_key.value = window.hyva.getFormKey();
        form_key.name = "form_key";
        form.appendChild(form_key);

        fetch(form.action, {
          method: "POST",
          body: new FormData(form),
        }).then(async (res) => {
          if (res.ok) {
            window.hyva.replaceDomElement("#MainContent", await res.text());
            this.focusOnCartAddedItems(addedProductSkus);
          }
        }).catch((error) => {
          console.error("Error while form submission", error);
          location.reload();
        }).finally(() => {
          this.isLoading = false;
          this.setActionBtnText();
        });
      },

      focusOnCartAddedItems(addedProductSkus = [] as string[]) {
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

      updateWishList(event) {
        const $form = event.target as HTMLFormElement;
        if (!$form) return;

        this.isLoading = true;
        const formData = new FormData($form);

        const isShareBtnClicked = this.actionBtnText.includes('shar');
        if (isShareBtnClicked) {
          formData.append('save_and_share', '');
        } else {
          formData.append('do', '');
        }

        fetch($form.action, {
          method: "POST",
          body: formData,
        })
            .then(async (res) => {
              if (res.ok) {
                const content = await res.text();

                if (isShareBtnClicked) {
                  await replaceMainContentWithTransition(res.url, content);
                  return;
                }

                window.hyva.replaceDomElement("#maincontent", content);
              }
            })
            .catch((error) => {
              console.error(`Error while ${isShareBtnClicked ? 'sharing' : 'updating'} wish list:`, error);
              location.reload();
            })
            .finally(() => {
              this.isLoading = false;
              this.setActionBtnText();
            });
      },
    };
