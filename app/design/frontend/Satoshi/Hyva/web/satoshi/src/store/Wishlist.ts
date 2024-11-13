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
  isInWishlist: boolean;

  setWishlistItems(wishlistItems: WishlistItem[]): void;
  handleWishlistButtonClick(event: Event, isWishlistVisible: boolean): void;
  showWishlist(): void;
  hideWishlist(): void;
};

const WISHLIST_RESIZABLE_ID = 'wishlist-desktop';
const WISHLIST_POPUP_ID = 'wishlist';

export const WishlistStore = <WishlistStoreType>{
  wishlistItems: [],
  isInWishlist: false,

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

  addToWishlist(productId: string, updateParams?: string) {
    const postParams = updateParams ||
      {
        action: BASE_URL + "wishlist/index/add/",
        data:
          {
            product: productId,
            uenc:
              hyva.getUenc()
          }
      }

    postParams.data['form_key'] = hyva.getFormKey();
    postParams.data['qty'] = document.getElementById(`qty[${productId}]`)
      ? document.getElementById(`qty[${productId}]`).value || 1
      : 1;

    let postData = Object.keys(postParams.data).map(key => {
      return `${key}=${postParams.data[key]}`;
    }).join('&');

    // take the all the input fields that configure this product
    // includes custom, configurable, grouped and bundled options
    Array.from(document.querySelectorAll(
      '[name^=options], [name^=super_attribute], [name^=bundle_option], [name^=super_group], [name^=links]')
    ).map(input => {
      if (input.type === "select-multiple") {
        Array.from(input.selectedOptions).forEach(option => {
          postData += `&${input.name}=${option.value}`
        })
      } else {
        // skip "checkable inputs" that are not checked
        if (!(['radio', 'checkbox', 'select'].includes(input.type) && !input.checked)) {
          postData += `&${input.name}=${input.value}`
        }
      }
    });
    fetch(postParams.action, {
      "headers": {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      "body": postData,
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    }).then((response) => {
      if (response.redirected && response.url.includes('/customer/account/login')) {
        window.location.href = response.url;
      } else if (response.ok) {
        return response.json();
      }
    }).then((response) => {
      if (!response) {
        return;
      }
      this.isInWishlist = true;
      this.showWishlist();
    }).catch((error) => {
      console.log(error);
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
        form_key: hyva.getFormKey(),
        uenc: hyva.getUenc(),
      }),
      mode: "cors",
      credentials: "include",
    })
      .then(response => {
        if (response.ok) {
          this.isInWishlist = false;
        } else {
          return response.text().then(text => {
            throw new Error(text);
          });
        }
      })
      .catch(error => {
        console.log('Error removing item from wishlist:', error);
      });

  }
};
