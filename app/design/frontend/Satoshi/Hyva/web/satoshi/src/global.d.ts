import type { Alpine as AlpineType } from "alpinejs";
import { PopupStoreType } from "./store/Popup";
import { TransitionStoreType } from "./plugins/Transition";
import { MainStoreType } from "./store/Main";
import { ResizableStoreType } from "./store/Resizable";
import { CartStoreType } from "./store/Cart";

declare global {
  var Alpine: AlpineType;

  interface Window {
    hyva: {
      getFormKey: () => string;
      formatPrice: (value: number) => string;
      getUenc: () => string;
      replaceDomElement: (element: HTMLElement) => void;
      strf: (value: string) => string;
      getBrowserStorage: (key: string) => string | null;
    };
    grecaptchaInstanceNewsletter?: number;
    googleRecaptchaCallbackNewsletter?: (response: string) => void;

    // TODO: Remove
    Shopify: {
      currency: {
        active: string;
      };
      locale: string;
      routes: {
        root: string;
      };
      cdnHost: string;
      PaymentButton: {
        init: () => void;
      };
      loadFeatures: () => void;
    };

    ShopifyXR?: {
      addModels: (models: any[]) => void;
      setupXRElements: (elements: HTMLElement[]) => void;
    };

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

    [key: string]: any;
  }

  const BASE_URL: string;
  const CURRENT_STORE_CODE: string;
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
  }

  interface XAttributes {
    _x_visible: boolean;
  }
}
