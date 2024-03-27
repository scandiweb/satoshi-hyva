import { CartType } from "./Cart";

export type CartItemType = {
  isDeleted: boolean;
  quantity: number;
  quantityInput: number | string;

  updateCart(): void;
  increaseQty(): void;
  decreaseQty(): void;
  setQty(): void;
} & CartType;

export const CartItem = (...args: unknown[]) => {
  const [id, qty] = args;

  return <CartItemType>{
    isDeleted: false,
    quantity: Number(qty),
    quantityInput: Number(qty),

    updateCart() {
      if (this.quantity !== this.quantityInput) {
        this.quantity = Number(this.quantityInput);
        this.updateCartItem(Number(id), this.quantity);
      }
    },

    increaseQty() {
      if (this.isLoading) {
        return;
      }

      this.quantityInput = Number(this.quantityInput) + 1;
      this.updateCart();
    },

    decreaseQty() {
      if (this.isLoading) {
        return;
      }

      this.quantityInput = Number(this.quantityInput) - 1;

      if (this.quantityInput === 0) {
        this.isDeleted = true;
      }

      this.updateCart();
    },

    setQty() {
      this.quantityInput = Math.max(1, Number(this.quantityInput));
      this.updateCart();
    },
  };
};
