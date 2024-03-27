import type { Alpine as AlpineType } from "alpinejs";
import { PopupStoreType } from "./store/Popup";
import { TransitionStoreType } from "./plugins/Transition";
import { MainStoreType } from "./store/Main";
import { ResizableStoreType } from "./store/Resizable";
import { PopupProductDetailsStoreType } from "./store/PopupProductDetails";

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
    };
    BASE_URL: string;
  }
}

declare module "alpinejs" {
  interface Stores {
    popup: PopupStoreType;
    resizable: ResizableStoreType;
    popupProductDetails: PopupProductDetailsStoreType;
    main: MainStoreType;
    transition: TransitionStoreType;
  }
}
