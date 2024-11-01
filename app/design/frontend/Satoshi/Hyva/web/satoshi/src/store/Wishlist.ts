import {navigateWithTransition} from "../plugins/Transition";

export type ImageType = {
  src: string;
  alt: string;
  template: string;
  width: number;
  height: number;
};

export type WishlistItem = {
  item_id: string;
  image: ImageType;
  product_sku: string;
  product_id: string;
  product_url: string;
  product_name: string;
  product_price: string;
  product_is_saleable_and_visible: boolean;
  product_has_required_options: boolean;
  add_to_cart_params: string;
  delete_item_params: string;
  options: {
    label: string;
    value: string | string[];
    option_id?: number;
    option_value?: string;
  }[];
};

export type WishlistStoreType = {
  wishlistItems: WishlistItem[];

  setWishlistItems(wishlistItems: WishlistItem[]): void;
  handleWishlistButtonClick(event: Event, isWishlistVisible: boolean): void;
  showWishlist(): void;
  hideWishlist(): void;
};

const WISHLIST_RESIZABLE_ID = 'wishlist-desktop';
const WISHLIST_POPUP_ID = 'wishlist';

export const WishlistStore = <WishlistStoreType>{
  wishlistItems: [],

  setWishlistItems(wishlistItems: WishlistItem[]) {
    this.wishlistItems = wishlistItems
  },

  handleWishlistButtonClick(event, isWishlistVisible) {
    if (Alpine.store('main').isUserLoggedIn) {
      isWishlistVisible ? this.hideWishlist() : this.showWishlist();
    } else {
      event.stopPropagation();
      navigateWithTransition('/wishlist');
    }
  },

  showWishlist() {
    if (Alpine.store('main').isMobile) {
      Alpine.store('popup').showPopup(WISHLIST_POPUP_ID, true);
    } else {
      Alpine.store('resizable').show(WISHLIST_RESIZABLE_ID);
    }
  },

  hideWishlist() {
    if (Alpine.store('main').isMobile) {
      Alpine.store('popup').hidePopup(WISHLIST_POPUP_ID);
    } else {
      Alpine.store('resizable').hide(WISHLIST_RESIZABLE_ID);
    }
  },
};
