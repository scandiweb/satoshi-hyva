import type { Alpine as AlpineType } from "alpinejs";
import { PopupStoreType } from "./store/Popup";
import { TransitionStoreType } from "./plugins/Transition";
import { MainStoreType } from "./store/Main";
import { ResizableStoreType } from "./store/Resizable";
import { CartStoreType } from "./store/Cart";
import { WishlistStoreType } from "./store/Wishlist";

declare global {
  var Alpine: AlpineType;

  interface Window {
    hyva: {
      formValidation: any;
      getFormKey: function;
      formatPrice: function;
      getUenc: function;
      replaceDomElement: function;
      strf: function;
      getBrowserStorage: function;
      releaseFocus: function;
      postForm: function;
      str(validationMessage: string, missing: number): any | boolean;
    };
    grecaptchaInstanceNewsletter?: number;
    googleRecaptchaCallbackNewsletter?: function;
    dispatchMessages: function;

    YT?: {
      Player: new (elementId: string, options: any) => any;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };

    onYouTubeIframeAPIReady?: () => void;
    navigationType: "MPA" | "SPA";

    [key: string]: any;
  }

  const BASE_URL: string;
  const CURRENT_STORE_CODE: string;
  const grecaptchaV2LoadCallbacks: Array<() => void>;
  const forceLoadRecaptchaScript: (form: HTMLElement | null) => void;
}

declare module "youtube-iframe-api" {
  export interface YT {
    Player: new (elementId: string, options: any) => any;
    PlayerState: {
      UNSTARTED: number;
      ENDED: number;
      PLAYING: number;
      PAUSED: number;
      BUFFERING: number;
      CUED: number;
    };
  }
}

declare module "alpinejs" {
  interface Stores {
    popup: PopupStoreType;
    resizable: ResizableStoreType;
    main: MainStoreType;
    transition: TransitionStoreType;
    cart: CartStoreType;
    wishlist: WishlistStoreType;
  }

  interface XAttributes {
    _x_visible: boolean;
  }
}
