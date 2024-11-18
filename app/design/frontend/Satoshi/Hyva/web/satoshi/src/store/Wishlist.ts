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
    this.wishlistItems = wishlistItems;
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

  async addToWishlist(productId: string, updateParams?: any | { action: string; data: Record<string, any> }) {
    const postParams = updateParams || {
      action: BASE_URL + "wishlist/index/add/",
      data: {
        product: productId,
        uenc: window.hyva.getUenc(),
      }
    };

    const qtyElement = document.getElementById(`qty[${productId}]`) as HTMLInputElement | null;
    postParams.data['form_key'] = window.hyva.getFormKey();
    postParams.data['qty'] = qtyElement?.value || 1;

    let postData = Object.keys(postParams.data).map(key => `${key}=${postParams.data[key]}`).join('&');

    Array.from(document.querySelectorAll(
      '[name^=options], [name^=super_attribute], [name^=bundle_option], [name^=super_group], [name^=links]'
    )).forEach((input) => {
      if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
        if (input instanceof HTMLSelectElement && input.type === "select-multiple") {
          Array.from(input.selectedOptions).forEach(option => {
            postData += `&${input.name}=${option.value}`;
          });
        } else if (input instanceof HTMLInputElement) {
          if (
            ['radio', 'checkbox'].includes(input.type) && input.checked ||
            input.type !== 'radio' && input.type !== 'checkbox'
          ) {
            postData += `&${input.name}=${input.value}`;
          }
        } else if (input instanceof HTMLSelectElement) {
          postData += `&${input.name}=${input.value}`;
        }
      }
    });


    fetch(postParams.action, {
      headers: {"content-type": "application/x-www-form-urlencoded; charset=UTF-8"},
      body: postData,
      method: "POST",
      mode: "cors",
      credentials: "include"
    })
      .then((response: Response) => {
        if (response.redirected && response.url.includes('/customer/account/login')) {
          window.location.href = response.url;
        } else if (response.ok) {
          return response.text();
        }
      })
      .then((content: string | undefined) => {
        if (content) {
          window.dispatchEvent(new CustomEvent("reload-customer-section-data"));
        }
      })
      .then(() => {
        this.showWishlist();
      })
      .catch((error: Error) => {
        console.error(error);
      });
  },
  removeFromWishlist(itemId: string) {
    fetch(`${BASE_URL}/wishlist/index/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        item: itemId,
        form_key: window.hyva.getFormKey(),
        uenc: window.hyva.getUenc(),
      }),
      mode: "cors",
      credentials: "include",
    })
      .then(() => {
        window.dispatchEvent(new CustomEvent("reload-customer-section-data"));
      })
      .catch(error => {
        console.log(error);
      });

  }
};
