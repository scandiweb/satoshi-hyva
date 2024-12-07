export type WishlistType = {
  isLoading: boolean;
  wishlistProducts: null | Record<string, any>;
  itemCount: number;
  wishlistCountLabel: null | string;
  wishlistItems: Record<string, any>;

  wishlistSidebarFetchHandler(
    body: string,
    postUrl: string,
    isRemoveAction?: boolean,
  ): void;
  receiveWishlistData(data: Record<string, any>): void;
  addToCart(json: string): void;
  removeFromWishlist(json: string): void;
};

export const Wishlist = (
  {
    itemAddedSuccessMessage,
    itemRemovedSuccessMessage,
    itemAddedWarningMessage,
    itemRemovedWarningMessage,
  }: {
    itemAddedSuccessMessage: string;
    itemRemovedSuccessMessage: string;
    itemAddedWarningMessage: string;
    itemRemovedWarningMessage: string;
  }
) =>
  <WishlistType>{
    isLoading: false,
    wishlistProducts: null,
    itemCount: 0,
    wishlistCountLabel: null,
    wishlistItems: {},

    wishlistSidebarFetchHandler(body, postUrl, isRemoveAction = true) {
      this.isLoading = true;

      const messages = {
        success: isRemoveAction
          ? itemRemovedSuccessMessage
          : itemAddedSuccessMessage,
        warning: isRemoveAction
          ? itemRemovedWarningMessage
          : itemAddedWarningMessage,
      };

      fetch(postUrl, {
        "headers": {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: body,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
      }).then(function (response) {
        if (response.redirected) {
          window.location.href = response.url;
        } else if (response.ok) {
          return response.json();
        } else {
          const message = {type: "warning", text: messages.warning};
          window.dispatchMessages && window.dispatchMessages([message], 5000);
        }
      }).then(function (response) {
        if (!response) return;
        const message = {
          type: (response.success) ? "success" : "error",
          text: (response.success) ? messages.success : response.error_message
        }
        window.dispatchMessages && window.dispatchMessages([message], 5000);
        window.dispatchEvent(new CustomEvent("reload-customer-section-data"));
      }).catch(function (error) {
        const message = {type: "error", text: error};
        window.dispatchMessages && window.dispatchMessages([message], 5000);
      })
        .finally(() => {
          this.isLoading = false;
        });
    },

    receiveWishlistData: function (data) {
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

    addToCart: function (json) {
      const obj = JSON.parse(json);
      const postUrl = obj.action;
      const body = "form_key=" + window.hyva.getFormKey() + "&item=" + obj.data.item + "&qty=" + obj.data.qty + "&uenc=" + window.hyva.getUenc();

      this.wishlistSidebarFetchHandler(body, postUrl, false);
    },

    removeFromWishlist: function(json) {
      const obj = JSON.parse(json);
      const postUrl = obj.action;
      const body = "form_key=" + window.hyva.getFormKey() + "&item=" + obj.data.item+"&uenc=" + window.hyva.getUenc();

      this.wishlistSidebarFetchHandler(body, postUrl);
    },
  };
