import {
  freezeScroll,
  makeElementScrollable,
  unfreezeScroll,
} from "../utils/scroll2";

type ProductDataType =
  | {
      img: string;
    }
  | {};

export type PopupProductDetailsStoreType = {
  _currentProductHandle: string | null;
  _currentProductDetailsDoc: string | null;
  _isLoading: boolean;
  _initialLoadedPopupLevel: number;
  show: (
    productHandle: string,
    productData?: ProductDataType,
    isFromPopstate?: boolean
  ) => void;
  hide: (isComingFromPopstate?: boolean) => void;
  _scrollToTop: () => void;
};

export const PopupProductDetailsStore = <PopupProductDetailsStoreType>{
  _currentProductHandle: null,
  _currentProductDetailsDoc: null,
  _isLoading: false,
  _initialLoadedPopupLevel: 0,

  async show(
    productHandle: string,
    productData: ProductDataType = {},
    isFromPopstate: boolean = false
  ) {
    if (!isFromPopstate) {
      const { popupLevel = 0 } = history.state || {};
      const nextPopupLevel = this._currentProductHandle ? popupLevel + 1 : 1;

      history.pushState(
        {
          productHandle,
          fallBackData: productData,
          popupLevel: nextPopupLevel,
        },
        "",
        window.location.href
      );
    }

    const event = new CustomEvent("popup-prod-fallback", {
      detail: productData,
    });

    window.dispatchEvent(event);
    this._scrollToTop();

    this._isLoading = true;
    freezeScroll();
    makeElementScrollable(
      document.getElementById("popup-product") || undefined
    );
    this._currentProductHandle = productHandle;

    const productUrl = `/products/${productHandle}`;
    const errorMessage =
      "Could not load the product, please close the popup and try again.";

    try {
      const response = await fetch(productUrl);

      if (!response.ok) {
        throw new Error("Network response was not ok: " + response.statusText);
      }

      const html = await response.text();
      // Unique comments around the desired content
      const startMarker = "<!-- StartProductDetails -->";
      const endMarker = "<!-- EndProductDetails -->";

      const startIndex = html.indexOf(startMarker) + startMarker.length;
      const endIndex = html.indexOf(endMarker);

      // Extracting the content between the markers
      const productDetailsHtml =
        startIndex > startMarker.length && endIndex > startIndex
          ? html.substring(startIndex, endIndex).trim()
          : null;

      this._currentProductDetailsDoc = productDetailsHtml || errorMessage;
      this._isLoading = false;
    } catch (_error) {
      this._currentProductDetailsDoc = errorMessage;
      this._isLoading = false;
    }
  },

  hide() {
    this._currentProductHandle = null;
    this._currentProductDetailsDoc = null;

    unfreezeScroll();
  },

  _scrollToTop() {
    const popupContentElement = document.getElementById("popup-product");

    popupContentElement?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  },
};
