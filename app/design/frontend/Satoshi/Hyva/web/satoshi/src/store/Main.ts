import type { Magics } from "alpinejs";
import { isMobile } from "../utils/device";

export type MainStoreType = {
  [key: string | symbol]: any;

  isHeaderShadowVisible: boolean;
  scaleFactor: number;
  yOffset: number;
  totalCartQty: number;
  isMobile: boolean;

  init(): void;
  setTransformValues(): void;
  setMobile(): void;
  getPrice(value: number | string): string;
  isPopupFocused(): boolean;
  hideAllPopupsAndResizables(): void;
} & Magics<{}>;

export const Main = <MainStoreType>{
  isHeaderShadowVisible: false,
  scaleFactor: 1,
  yOffset: 0,
  totalCartQty: 0,
  isMobile: isMobile(),

  init() {
    this.setTransformValues();

    // listen to resize and compute if is mobile
    window.addEventListener("resize", this.setMobile.bind(this));
  },

  setMobile() {
    this.isMobile = isMobile();
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

  getPrice(value) {
    const locale = window?.Shopify?.locale || "en";
    const currency = window?.Shopify?.currency?.active || "USD";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(Number(value) || 0);
  },

  isPopupFocused() {
    return this.isMobile
      ? Alpine.store("popup").isCurrentPopupFocused
      : Object.keys(Alpine.store("resizable")._current).length > 0 ||
          !!Alpine.store("popupProductDetails")._currentProductHandle;
  },

  hideAllPopupsAndResizables() {
    Alpine.store("popup").onPopupOverlayClick();
    Alpine.store("popupProductDetails").hide();
    Alpine.store("resizable").hideAll();
  },
};
