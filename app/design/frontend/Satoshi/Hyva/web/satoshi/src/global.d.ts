import type { Alpine as AlpineType } from "alpinejs";
import { PopupStoreType } from "./store/Popup";
import { TransitionStoreType } from "./plugins/Transition";
import { MainStoreType } from "./store/Main";
import { ResizableStoreType } from "./store/Resizable";
import { CartStoreType } from "./store/Cart";

declare global {
  var Alpine: AlpineType;

  interface Window {
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
        init: function;
      };
      loadFeatures: function;
    };
    ShopifyXR?: {
      addModels: function;
      setupXRElements: function;
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
