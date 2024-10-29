import type { Magics } from "alpinejs";
import { navigateWithTransition } from "../plugins/Transition";

export type RecentOrdersType = {
  reorderProducts: {
    items: any[];
    data_id: number;
  } | null;
  itemCount: number;
  reorderItems: any[];
  isShowAddToCart: boolean;
  checkboxId: string;
  isLoading: boolean;

  receiveReorderData(data: any): void;
  addToCart(postUrl: string): void;
  reorderSidebarFetchHandler(body: string, postUrl: string): any;
  onReorder(event: Event): void;
} & Magics<{}>;

export const RecentOrders = (messageText: string) =>
  <RecentOrdersType>{
    reorderProducts: null,
    itemCount: 0,
    reorderItems: {},
    isShowAddToCart: false,
    checkboxId: "reorder-item-",
    isLoading: false,

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

    addToCart(postUrl) {
      let params = "";
      const checkboxes: any = document.getElementsByName("order_items[]");
      for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
          params += "&order_items[]=" + checkboxes[i].value;
        }
      }
      params = "form_key=" + window.hyva.getFormKey() + params;
      this.reorderSidebarFetchHandler(params, postUrl);
    },

    reorderSidebarFetchHandler(body, postUrl) {
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
            return response.json();
          } else {
            window.dispatchMessages &&
              window.dispatchMessages(
                [{ type: "warning", text: messageText }],
                5000,
              );
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
          this.isLoading = false;
          const cartItems = Alpine.store("cart").cartItems;
          const itemIds = this.reorderItems
            .map((reorderItem: any) => 
              cartItems.find((cartItem: any) => cartItem.product_id === reorderItem.product_id)?.item_id
            )
            .filter((itemId): itemId is string => !!itemId);

          if(itemIds.length) {
            Alpine.store("cart").showCart();
          }
        });
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
  };
