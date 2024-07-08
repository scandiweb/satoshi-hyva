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

export type CartStoreType = {
  cartItems: CartItem[];
  isCartInitialized: boolean;
  isLoading: boolean;
  addingItemIds: number[];
  removingItemId: string | null;
  abortController: AbortController | null;
  errors: Record<string, string[]>;
  setCartItems(cartItems: CartItem[]): void;
  addCartItems(cartItems: CartItem[]): void;
  processCartItems(items: CartItem[]): CartItem[];
  updateCartItem(item_id: string, qty: number): void;
  focusInCart(key: string): void;
  increaseQty(item_id: string): void;
  decreaseQty(item_id: string): void;
  setQty(qty: number, item_id: string): void;
  setDiscounts(discounts: any): void;
  subtotalPrice(): string;
  totalPrice(): string;
  addToCart(): void;
  showCart(): void;
  hideCart(): void;
  _updateFocusAnimation(): void;
};

const CART_RESIZABLE_ID = "cart-desktop";
const CART_POPUP_ID = "cart";
const ABORT_ERROR_NAME = "AbortError";

export const CartStore = <CartStoreType>{
  cartItems: [],
  isCartInitialized: false,
  isLoading: false,
  addingItemIds: [],
  removingItemId: null,
  abortController: null,
  errors: {},

  setCartItems(cartItems: CartItem[]) {
    this.cartItems = cartItems;
    Alpine.store("main").totalCartQty = cartItems.length;
  },

  addCartItems(cartItems: CartItem[]) {
    this.setCartItems([...cartItems, ...this.cartItems]);
  },

  // TODO: Might be redundant
  processCartItems(items) {
    return items;
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

  updateCartItem(item_id, qty) {
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

    const params: Record<string, string> = {
      item_id,
      item_qty: qty.toString(),
      form_key: window.hyva.getFormKey()
    }
    let url = '/checkout/sidebar/updateItemQty';

    if (cartItem.qty === 0) {
      cartItem.isDeleted = true;
      this.removingItemId = item_id;

      delete params.item_qty;
      url = '/checkout/sidebar/removeItem';
    }

    const queryParams = new URLSearchParams(params);
    fetch(`${url}?${queryParams}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: this.abortController.signal,
    })
      .then(() => {
        this.isLoading = false;
        this.removingItemId = null;
        this.cartItems = this.cartItems.filter(item => item.qty);
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
      this.updateCartItem(item_id, cartItem.qty);
    }
  },

  focusInCart(key) {
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

      this.updateCartItem(item_id, cartItem.qty);
    }
  },

  setQty(qty, item_id) {
    console.log('xxx setting qty')
    const cartItem = this.cartItems.find((item) => item.item_id === item_id);

    if (cartItem) {
      cartItem.qty = Math.max(0, Number(qty));
      this.updateCartItem(item_id, cartItem.qty);
    }
  },

  setDiscounts(discounts: any) {
    // this.discounts = discounts;
  },

  subtotalPrice() {
    const subtotalPrice = this.cartItems.reduce(
      (total, item) => total + item.product_price_value * item.qty,
      0,
    );
    return window.hyva.formatPrice(subtotalPrice);
  },

  totalPrice() {
    const subtotalPrice = this.cartItems.reduce(
      (total, item) => total + item.product_price_value * item.qty,
      0,
    );

    // TODO: Calculate with discounts
    const discounts = 0;

    return window.hyva.formatPrice(subtotalPrice - discounts);
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
