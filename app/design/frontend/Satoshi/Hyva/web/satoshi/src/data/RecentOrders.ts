import type { Magics } from "alpinejs";
import { navigateWithTransition } from "../plugins/Transition";
import { CartItem } from "../store/Cart.ts";

export type RecentOrdersType = {
  reorderProducts: { items: any[]; data_id: number } | null;
  itemCount: number;
  reorderItems: any[];
  checkedItems: { [key: string]: string };
  isShowAddToCart: boolean;
  isLoading: boolean;
  checkboxId: string;
  errorMessage: string;

  receiveReorderData(data: any): void;
  addToCart(postUrl: string): void;
  reorderSidebarFetchHandler(body: string, postUrl: string, addedProductSkus: string[]): any;
  focusOnCartAddedItems(addedProductSkus: string[]): void;
  onReorder(event: Event): void;
  onCheckboxesChange(event: Event): void;
  isCheckedItems(): boolean;
  setErrorMessage(message: string): void;
} & Magics<{}>;

export const RecentOrders = (errorMessageText: string) =>
  <RecentOrdersType>{
    reorderProducts: null,
    itemCount: 0,
    reorderItems: {},
    checkedItems: {},
    checkboxId: "reorder-item-",
    isShowAddToCart: false,
    isLoading: false,
    errorMessage: '',

    receiveReorderData(data) {
      if (data["last-ordered-items"]) {
        this.reorderProducts = data["last-ordered-items"];
        this.itemCount = this.reorderProducts!.items.length;
        this.reorderItems = this.reorderProducts!.items;
        this.isShowAddToCart = this.reorderItems.some(
          (product: any) => product.is_saleable === true,
        );
      }
    },

    onCheckboxesChange(event) {
      const target = event.target as HTMLInputElement;
      const checkboxId = target.id;

      if (target.checked) {
        this.checkedItems = {...this.checkedItems, [checkboxId]: target.value};
      } else {
        delete this.checkedItems[checkboxId];
      }
    },

    isCheckedItems() {
      return Object.keys(this.checkedItems).length > 0;
    },

    addToCart(postUrl) {
      let params = "";
      const addedProductSkus = Object.entries(this.checkedItems)
        .map(([key, value]) => {
          params += `&order_items[]=${value}`;
          return key.slice(this.checkboxId.length);
        });

      if (!params.includes('order_items')) {
        return;
      }

      params = "form_key=" + window.hyva.getFormKey() + params;
      this.reorderSidebarFetchHandler(params, postUrl, addedProductSkus);
    },

    reorderSidebarFetchHandler(body, postUrl, addedProductSkus) {
      const postHeaders: Record<string, any> = {
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: body,
        method: "POST",
        mode: "cors",
        credentials: "include",
      };

      this.isLoading = true;
      return fetch(postUrl, postHeaders)
        .then(async (response) => {
          if (response.redirected) {
            const content = await response.text();
            window.hyva.replaceDomElement("#recent-orders-sidebar", content);
          } else if (response.ok) {
            this.setErrorMessage("");
            return response.json();
          } else {
            this.setErrorMessage(errorMessageText);
          }
        })
        .then((result) => {
          if (!result) return;
          if (result.error_message) {
            const message = { type: "error", text: result.error_message };
            window.dispatchMessages && window.dispatchMessages([message], 5000);
          }
          window.dispatchEvent(new CustomEvent("reload-customer-section-data"));
        })
        .catch((error) => {
          const message = { type: "error", text: error };
          window.dispatchMessages && window.dispatchMessages([message], 5000);
        }).finally(() => {
          this.focusOnCartAddedItems(addedProductSkus);
          this.isLoading = false;
        });
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

    onReorder(event) {
      const target = event.target as HTMLElement;
      const $form = target?.closest("form");

      if (!$form) return;

      const formData = new FormData($form);
      this.isLoading = true;

      fetch($form.action, {
        method: "POST",
        body: formData,
      }).then((res) => {
        if (res.ok) {
        navigateWithTransition('/checkout/cart');
        }
      }).catch((error) => {
        console.error("Error while processing reorder request:", error);
        location.reload();
      }).finally(() => {
          this.isLoading = false;
      });
    },

    setErrorMessage(message) {
      this.errorMessage = message || "";
    },
  };
