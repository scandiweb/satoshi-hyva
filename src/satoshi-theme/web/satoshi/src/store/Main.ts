import type { Magics } from "alpinejs";
import { isMobile } from "../utils/device";
import { unfreezeScroll } from "../utils/scroll2";

export type PrivateContentData = {
  cart: {
    items: any;
    cartTotals: any;
  };
  wishlist: {
    counter: string | null;
    data_id: number;
    items: any;
  };
  customer: {
    signin_token?: string;
  };
};

export type MainStoreType = {
  [key: string | symbol]: any;

  isHeaderShadowVisible: boolean;
  scaleFactor: number;
  yOffset: number;
  totalCartQty: number;
  isMobile: boolean;
  isReducedMotion: boolean;
  opacityOnZoom: number;
  isUserLoggedIn: boolean;

  onResize(): void;
  init(): void;
  updatePrivateContent(data: PrivateContentData): void;
  setTransformValues(): void;
  isPopupFocused(): boolean;
  hideAllPopupsAndResizables(): void;
  getBackURL(defaultURL?: string): string;
} & Magics<{}>;

export const Main = <MainStoreType>{
  isHeaderShadowVisible: false,
  scaleFactor: 1,
  yOffset: 0,
  totalCartQty: 0,
  isMobile: isMobile(),
  isReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
    .matches,
  opacityOnZoom: 1,
  isUserLoggedIn: false,

  init() {
    this.setTransformValues();
    this.onResize();

    // listen to resize and compute if is mobile
    window.addEventListener("resize", this.onResize.bind(this));

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    mediaQuery.addEventListener("change", (e: any) => {
      this.isReducedMotion = e.matches;
    });
  },

  updatePrivateContent(data) {
    this.isUserLoggedIn = Boolean(data.customer?.signin_token);
    Alpine.store("wishlist").setWishlistItems(data.wishlist?.items || []);
    Alpine.store("cart").setCartItems(data.cart?.items || []);
    if (data.cart?.cartTotals) {
      Alpine.store("cart").setCartTotals(data.cart?.cartTotals || []);
    }
  },

  onResize() {
    const newIsMobile = isMobile();

    if (this.isMobile !== newIsMobile) {
      // cleanup popups and resizables on resolution change
      Alpine.store("popup").currentPopup = null;
      Alpine.store("resizable")._current = {};
      unfreezeScroll();
    }

    this.isMobile = newIsMobile;

    document.documentElement.style.setProperty(
      "--screen-width",
      window.innerWidth.toString(),
    );

    document.documentElement.style.setProperty(
      "--screen-height",
      window.innerHeight.toString(),
    );
  },

  setTransformValues() {
    const desiredOffset = 8;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const desiredEndWidth = windowWidth + desiredOffset * 2;
    const documentScrollHeight = document.body.scrollHeight;

    // Calculate the scale factor for width and height
    const widthScaleFactor = (desiredEndWidth - windowWidth) / windowWidth;
    const heightScaleFactor = (windowHeight - desiredOffset * 2) / windowHeight;

    // Determine the minimum scale factor to maintain the aspect ratio
    const minScaleFactor = Math.min(widthScaleFactor, heightScaleFactor);
    const newScaleFactor = 1 + minScaleFactor;

    const newYOffset =
      (documentScrollHeight * minScaleFactor * -1 * window.scrollY) /
      documentScrollHeight;

    this.scaleFactor = newScaleFactor;
    this.yOffset = newYOffset;
  },

  isPopupFocused() {
    return this.isMobile
      ? Alpine.store("popup").isCurrentPopupFocused
      : Object.keys(Alpine.store("resizable")._current).length > 0;
  },

  hideAllPopupsAndResizables() {
    Alpine.store("popup").onPopupOverlayClick();
    Alpine.store("resizable").hideAll();
  },

  getBackURL(defaultURL = "/") {
    if (window.history.state?.backURL) {
      return window.history.state.backURL;
    }

    const previousURL = document.referrer;
    if (previousURL && new URL(previousURL).origin === window.location.origin) {
      return previousURL;
    }

    return defaultURL;
  },
};
