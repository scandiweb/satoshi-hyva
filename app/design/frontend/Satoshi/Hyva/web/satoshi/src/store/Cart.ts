export type GiftProps = {
  __shopify_send_gift_card_to_recipient: Boolean;
  "Recipient email": string | null;
  "Recipient name": string | null;
  Message: string | null;
  "Send on": string | null;
};

export type GiftStringProps = Omit<
  GiftProps,
  "__shopify_send_gift_card_to_recipient"
>;

export type CartItem = {
  id: number;
  key: string;
  variant_id: number;
  quantity: number;
  image: string;
  title: string;
  url: string;
  product_title: string;
  product_has_only_default_variant: Boolean;
  options_with_values: { name: string; value: string }[];
  line_level_discount_allocations: Array<any>;
  original_price: number;
  final_price: number;
  isDeleted?: Boolean;
  focusedUntil?: number;
  properties: GiftProps;
  selling_plan_allocation?: {
    selling_plan: {
      id: number;
    };
  };
};

export type itemProps = {
  id: number;
  quantity: number;
  properties: GiftProps;
  [key: string]: any;
};

export type CartStoreType = {
  cartItems: CartItem[];
  discounts: {
    title: string;
    total_allocated_amount: number;
  }[];
  isCartInitialized: boolean;
  isLoading: boolean;
  addingItemIds: number[];
  removingItemKey: string | null;
  abortController: AbortController | null;
  errors: Record<string, string[]>;
  setCartItems(cartItems: CartItem[]): void;
  addCartItems(cartItems: CartItem[]): void;
  processCartItems(items: CartItem[]): CartItem[];
  updateCartItem(key: string, qty: number): void;
  focusInCart(key: string): void;
  increaseQty(key: string): void;
  decreaseQty(key: string): void;
  setQty(quantity: number, key: string): void;
  setDiscounts(discounts: any): void;
  subtotalPrice(): string;
  totalPrice(): string;
  money(money: number, currency: string): string;
  addToCart(itemProps: itemProps): void;
  showCart(): void;
  hideCart(): void;
  _updateFocusAnimation(): void;
};

const CART_RESIZABLE_ID = "cart-desktop";
const CART_POPUP_ID = "cart";
const SECTION_MAIN_CART_ITEMS = "main-cart-items";
const ABORT_ERROR_NAME = "AbortError";

export const CartStore = <CartStoreType>{
  cartItems: [],
  discounts: [],
  isCartInitialized: false,
  isLoading: false,
  addingItemIds: [],
  removingItemKey: null,
  abortController: null,
  errors: {},

  setCartItems(cartItems: CartItem[]) {
    this.cartItems = cartItems;
    Alpine.store("main").totalCartQty = cartItems.length;
  },

  addCartItems(cartItems: CartItem[]) {
    this.setCartItems([...cartItems, ...this.cartItems]);
  },

  // Cart items returned from 'cart/add.js' and 'cart/update.js' AJAX calls have image SRCs with cdn.shopify.com base URL.
  // This method updates the image SRCs to make them consistent with the SRCs we already have in PDP
  processCartItems(items) {
    return items.map((item: CartItem) => {
      return {
        ...item,
        image: item.image.replace(
          /^https:\/\/cdn\.shopify\.com\/s\/files\/(?:\d+\/)+files/,
          `//${window.Shopify.cdnHost}/shop/files`,
        ),
      };
    });
  },

  addToCart(itemProps: itemProps) {
    const { id } = itemProps;

    if (!this.addingItemIds.includes(id)) {
      this.addingItemIds.push(id);
    }

    const formData = {
      items: [itemProps],
    };

    fetch(`${window.Shopify.routes.root}cart/add.js`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.status === 422) {
          this.errors = response.errors;
          return;
        }
        const items = this.processCartItems(response.items);
        this.addCartItems(items);
        this.focusInCart(response.items[0]?.key);
        this.errors = {};
      })
      .catch((error) => console.error("Error:", error))
      .finally(() => {
        this.addingItemIds = this.addingItemIds.filter(
          (itemId) => itemId !== id,
        );
      });
  },

  updateCartItem(key, qty) {
    // Abort the previous request if it exists
    if (this.abortController) {
      this.removingItemKey = null;
      this.abortController.abort();
    }

    this.isLoading = true;
    this.abortController = new AbortController();

    const cartItem = this.cartItems.find((item) => item.key === key);

    if (!cartItem) {
      return;
    }

    if (cartItem.quantity === 0) {
      cartItem.isDeleted = true;
      this.removingItemKey = key;
    }

    fetch(`${window.Shopify.routes.root}cart/update.js`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updates: {
          [key]: qty,
        },
        sections: SECTION_MAIN_CART_ITEMS,
      }),
      signal: this.abortController.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        const items = this.processCartItems(data.items);
        this.setCartItems(items);

        this.isLoading = false;
        this.removingItemKey = null;
      })
      .catch((error) => {
        if (error.name !== ABORT_ERROR_NAME) {
          console.error("Error:", error);

          this.isLoading = false;
          this.removingItemKey = null;
        }
      });
  },

  increaseQty(key) {
    const cartItem = this.cartItems.find((item) => item.key === key);

    if (cartItem) {
      cartItem.quantity = Number(cartItem.quantity) + 1;
      this.updateCartItem(key, cartItem.quantity);
    }
  },

  focusInCart(key) {
    this.cartItems.forEach((cartItem) => {
      const isFocused = cartItem.key === key;
      cartItem.focusedUntil = isFocused ? Date.now() + 2000 : undefined;
    });

    this.showCart();
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

  decreaseQty(key) {
    const cartItem = this.cartItems.find((item) => item.key === key);

    if (cartItem) {
      cartItem.quantity = Number(cartItem.quantity) - 1;

      this.updateCartItem(key, cartItem.quantity);
    }
  },

  setQty(quantity, key) {
    const cartItem = this.cartItems.find((item) => item.key === key);

    if (cartItem) {
      cartItem.quantity = Math.max(0, Number(quantity));
      this.updateCartItem(key, cartItem.quantity);
    }
  },

  setDiscounts(discounts: any) {
    this.discounts = discounts;
  },

  subtotalPrice() {
    const subtotalPrice = this.cartItems.reduce(
      (total, item) => total + item.final_price * item.quantity,
      0,
    );
    return this.money(subtotalPrice, window.Shopify.currency.active);
  },

  totalPrice() {
    const subtotalPrice = this.cartItems.reduce(
      (total, item) => total + item.final_price * item.quantity,
      0,
    );

    const discounts = this.discounts.reduce(
      (total, discount) => total + discount.total_allocated_amount,
      0,
    );

    return this.money(
      subtotalPrice - discounts,
      window.Shopify.currency.active,
    );
  },

  money(money, currency) {
    const originalPrice = money / 100;
    const formattedPrice = originalPrice.toLocaleString("en-US", {
      style: "currency",
      currency,
    });
    return formattedPrice;
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
};
