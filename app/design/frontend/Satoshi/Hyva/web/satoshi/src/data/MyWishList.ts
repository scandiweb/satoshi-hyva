import { Magics } from "alpinejs";
import { replaceMainContentWithTransition } from "../plugins/Transition";

export type PostParams = {
  action: string;
  data: Record<string, string>;
  skipUenc?: boolean;
};

export type MyWishListType = {
  isLoading: boolean;
  actionBtnText: string;
  addToCart(productId: string, postParams: any): void;
  addAllItemsToCart(): void;
  postFormWithRedirect(postParams: PostParams): void;
  setActionBtnText(text?: string): void;
  updateWishList(event: Event): void;
} & Magics<{}>;

export const MyWishList = (
    urlParams: { action: string, data: any },
) =>
    <MyWishListType>{
      isLoading: false,
      actionBtnText: '',
      addToCart(productId, postParams) {
        const qtyInput = this.$refs[`product-qty-${productId}`] as HTMLInputElement | null;
        postParams.data.qty = qtyInput?.value ?? postParams.data.qty;

        this.postFormWithRedirect(postParams);
      },

      addAllItemsToCart() {
        let separator = urlParams.action.indexOf('?') >= 0 ? '&' : '?';

        Array.from(document.querySelectorAll('input[name^=qty]')).map((qty) => {
          const inputElement = qty as HTMLInputElement;
          urlParams.action += separator + inputElement.name + '=' + encodeURIComponent(inputElement.value);
          separator = '&';
        });

        this.postFormWithRedirect(urlParams);
      },

      postFormWithRedirect(postParams) {
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
          }
        }).catch((error) => {
          console.error("Error while form submission", error);
          location.reload();
        }).finally(() => {
          this.isLoading = false;
          this.setActionBtnText();
        });
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

                window.hyva.replaceDomElement($form.id, content);
              }
            })
            .catch((error) => {
              console.error("Error while updating wish list:", error);
              location.reload();
            })
            .finally(() => {
              this.isLoading = false;
              this.setActionBtnText();
            });
      },
    };
