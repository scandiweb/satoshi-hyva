export type CartItem = {
  item_id: string;
  product_id: string;
  configure_url: string;
  product_type: string;
  options: {
    label: string;
    value: string;
    option_id: number;
    option_value: string;
  }[];
  qty: number;
  is_visible_in_site_visibility: boolean;
  product_name: string;
  product_sku: string;
  product_url: string;
  product_has_url: boolean;
  product_price: string;
  product_price_value: number;
  product_image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  canApplyMsrp: boolean;
  message: string;
  isDeleted?: Boolean;
  focusedUntil?: number;
};

export type CartTotals = {
  total_segments: {
    code: string;
    title: string;
    value: string;
    extension_attributes: Record<string, any>[];
  }[];
  grand_total: string;
  include_tax_in_grand_total: boolean;
  is_virtual: boolean;
  selected_shipping_method: any;
  review_shipping_display_mode: string;
  subtotal: string;
  subtotal_incl_tax: string;
  review_total_display_mode: string;
  is_zero_subtotal: boolean;
  is_full_tax_summary_displayed: boolean;
};

export type CartStoreType = {
  cartItems: CartItem[];
  cartTotals: any;
  isLoading: boolean;
  addingItemIds: number[];
  removingItemId: string | null;
  abortController: AbortController | null;
  errors: Record<string, string[]>;
  setCartTotals(cartTotals: CartTotals): void;
  updateCartTotals(cartTotals: CartTotals): void;
  setCartItems(cartItems: CartItem[]): void;
  addCartItems(cartItems: CartItem[]): void;
  updateCartItem(item_id: string): void;
  focusInCart(key: string): void;
  increaseQty(item_id: string): void;
  decreaseQty(item_id: string): void;
  setQty(qty: number, item_id: string): void;
  addToCart(): void;
  applyCoupon(form: HTMLFormElement): void;
  showCart(): void;
  hideCart(): void;
  _updateFocusAnimation(): void;
};

const CART_RESIZABLE_ID = "cart-desktop";
const CART_POPUP_ID = "cart";
const ABORT_ERROR_NAME = "AbortError";

export const CartStore = <CartStoreType>{
  cartItems: [],
  cartTotals: {},
  isLoading: false,
  addingItemIds: [],
  removingItemId: null,
  abortController: null,
  errors: {},

  setCartTotals(cartTotals: CartTotals) {
    this.cartTotals = cartTotals;
  },
  updateCartTotals(cartTotals: CartTotals) {
    this.cartTotals = {
      ...this.cartTotals,
      ...cartTotals,
    };
  },

  setCartItems(cartItems: CartItem[]) {
    this.cartItems = cartItems;
    Alpine.store("main").totalCartQty = cartItems.length;
  },

  addCartItems(cartItems: CartItem[]) {
    this.setCartItems([...cartItems, ...this.cartItems]);
  },

  addToCart() {
    //   const { id } = itemProps;
    //   if (!this.addingItemIds.includes(id)) {
    //     this.addingItemIds.push(id);
    //   }
    //   const formData = {
    //     items: [itemProps],
    //   };
    //   fetch(`${window.Shopify.routes.root}cart/add.js`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(formData),
    //   })
    //     .then((response) => response.json())
    //     .then((response) => {
    //       if (response.status === 422) {
    //         this.errors = response.errors;
    //         return;
    //       }
    //       const items = this.processCartItems(response.items);
    //       this.addCartItems(items);
    //       this.focusInCart(response.items[0]?.key);
    //       this.errors = {};
    //     })
    //     .catch((error) => console.error("Error:", error))
    //     .finally(() => {
    //       this.addingItemIds = this.addingItemIds.filter(
    //         (itemId) => itemId !== id,
    //       );
    //     });
  },

  updateCartItem(item_id) {
    // Abort the previous request if it exists
    if (this.abortController) {
      this.removingItemId = null;
      this.abortController.abort();
    }

    this.isLoading = true;
    this.abortController = new AbortController();

    const cartItem = this.cartItems.find((item) => item.item_id === item_id);

    if (!cartItem) {
      return;
    }

    if (cartItem.qty === 0) {
      cartItem.isDeleted = true;
      this.removingItemId = item_id;
    }

    const formData = new FormData();
    formData.append("form_key", window.hyva.getFormKey());
    formData.append("uenc", window.hyva.getUenc());
    this.cartItems.forEach((item) => {
      formData.append(`cart[${item.item_id}][qty]`, item.qty.toString());
    });

    fetch(`/checkout/cart/updatePost`, {
      method: "POST",
      body: formData,
      signal: this.abortController.signal,
    })
      .then((result) => {
        return result.text();
      })
      .then((content) => {
        window.hyva.replaceDomElement("#cart-button", content);
        this.isLoading = false;
        this.removingItemId = null;
        this.cartItems = this.cartItems.filter((item) => item.qty);
      })
      .catch((error) => {
        if (error.name !== ABORT_ERROR_NAME) {
          console.error("Error:", error);

          this.isLoading = false;
          this.removingItemId = null;
        }
      });
  },

  increaseQty(item_id) {
    const cartItem = this.cartItems.find((item) => item.item_id === item_id);

    if (cartItem) {
      cartItem.qty = Number(cartItem.qty) + 1;
      this.updateCartItem(item_id);
    }
  },

  focusInCart(_key) {
    // this.cartItems.forEach((cartItem) => {
    //   const isFocused = cartItem.key === key;
    //   cartItem.focusedUntil = isFocused ? Date.now() + 2000 : undefined;
    // });
    // this.showCart();
  },

  decreaseQty(item_id) {
    const cartItem = this.cartItems.find((item) => item.item_id === item_id);

    if (cartItem) {
      cartItem.qty = Number(cartItem.qty) - 1;

      this.updateCartItem(item_id);
    }
  },

  setQty(qty, item_id) {
    const cartItem = this.cartItems.find((item) => item.item_id === item_id);

    if (cartItem) {
      cartItem.qty = Math.max(0, Number(qty));
      this.updateCartItem(item_id);
    }
  },

  applyCoupon(form: HTMLFormElement) {
    // Abort the previous request if it exists
    if (this.abortController) {
      this.removingItemId = null;
      this.abortController.abort();
    }

    this.isLoading = true;
    this.abortController = new AbortController();

    const formData = new FormData(form);
    formData.append("uenc", window.hyva.getUenc());
    formData.append("form_key", window.hyva.getFormKey());

    fetch(form.action, {
      method: "POST",
      body: formData,
      signal: this.abortController.signal,
    })
      .then((result) => {
        return result.text();
      })
      .then((content) => {
        window.hyva.replaceDomElement("#cart-button", content);
        window.hyva.replaceDomElement("#apply-coupon", content);
        this.isLoading = false;
      })
      .catch((error) => {
        if (error.name !== ABORT_ERROR_NAME) {
          console.error("Error:", error);
          this.isLoading = false;
        }
      });
  },

  _updateFocusAnimation() {
    this.cartItems.forEach((cartItem: CartItem) => {
      if (cartItem.focusedUntil) {
        cartItem.focusedUntil =
          Date.now() < cartItem.focusedUntil
            ? cartItem.focusedUntil
            : undefined;
      }
    });
  },

  showCart() {
    if (Alpine.store("main").isMobile) {
      Alpine.store("popup").showPopup(CART_POPUP_ID, true);
    } else {
      Alpine.store("resizable").show(CART_RESIZABLE_ID);
    }
  },

  hideCart() {
    this._updateFocusAnimation();

    if (Alpine.store("main").isMobile) {
      Alpine.store("popup").hidePopup(CART_POPUP_ID);
    } else {
      Alpine.store("resizable").hide(CART_RESIZABLE_ID);
    }
  },
};
