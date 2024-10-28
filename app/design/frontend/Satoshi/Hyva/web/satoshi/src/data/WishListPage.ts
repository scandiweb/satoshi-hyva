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
  postFormWithRedirect(postParams: PostParams, addedProductIds: string[]): void;
  focusOnCartAddedItems(addedProductIds: string[]): void;
  setActionBtnText(text?: string): void;
  updateWishList(event: Event): void;
} & Magics<{}>;

export const WishListPage = (
    urlParams: { action: string, data: any },
) =>
    <WishListPageType>{
      isLoading: false,
      actionBtnText: '',

      addToCart(itemId, postParams, productId) {
        const qtyInput = this.$refs[`product-qty-${itemId}`] as HTMLInputElement | null;
        postParams.data.qty = qtyInput?.value ?? postParams.data.qty;

        this.postFormWithRedirect(postParams, [productId]);
      },

      addAllItemsToCart() {
        let separator = urlParams.action.indexOf('?') >= 0 ? '&' : '?';
        const addedProductIds = [] as string[];

        document.querySelectorAll('input[name^=qty]').forEach((inputElement) => {
          const input = inputElement as HTMLInputElement;
          urlParams.action += separator + input.name + '=' + encodeURIComponent(input.value);
          separator = '&';

          const productId = input.getAttribute('data-product-id') as string;
          if (productId) {
            addedProductIds.push(productId);
          }
        });

        this.postFormWithRedirect(urlParams, addedProductIds);
      },

      postFormWithRedirect(postParams, addedProductIds = [] as string[]) {
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
            this.focusOnCartAddedItems(addedProductIds);
          }
        }).catch((error) => {
          console.error("Error while form submission", error);
          location.reload();
        }).finally(() => {
          this.isLoading = false;
          this.setActionBtnText();
        });
      },

      focusOnCartAddedItems(addedProductIds = [] as string[]) {
        const cartItems = Alpine.store("cart").cartItems;

        const itemIds = cartItems
            .filter((item: CartItem) => addedProductIds.includes(item.product_id))
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
