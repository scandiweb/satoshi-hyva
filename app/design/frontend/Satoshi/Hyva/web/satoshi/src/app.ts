// import Alpine from "alpinejs";
import "../theme/app.scss";

import persist from "@alpinejs/persist";
import morph from "@alpinejs/morph";

import ElementTransition from "./plugins/Transition";
import ElementIntersection from "./plugins/Intersect";
import Pagination from "./plugins/Pagination";
import Accessibility from "./plugins/Accessibility.js";
import Portal from "./plugins/Portal";
import StickyScroll from "./plugins/StickyScroll";

import { PopupStore } from "./store/Popup";
import { ResizableStore } from "./store/Resizable";
import { ProductListStore } from "./store/ProductList";
import { Main } from "./store/Main";
import { CartStore } from "./store/Cart";

import { BeforeAfter } from "./data/BeforeAfter";
import { TransitionPreview } from "./data/TransitionPreview";
import { ProductList } from "./data/ProductList";
import { Filters } from "./data/Filters";
import { ProductPage } from "./data/ProductPage";
import { DownloadableProduct } from "./data/DownloadableProduct";
import { RecentOrders } from "./data/RecentOrders";
import { Dropdown } from "./data/Dropdown";
import { Search } from "./data/Search";
import { Shipping } from "./data/Shipping.js";
import { Accordion } from "./data/Accordion";
import { Address } from "./data/Address";
import { RangeSlider } from "./data/RangeSlider";
import { Slider } from "./data/Slider";
import { CountdownTimer } from "./data/CountdownTimer";
import { TransitionImage } from "./data/TransitionImage";
import { Authentication } from "./data/Authentication";
import { Gallery } from "./data/Gallery.ts";
import { Newsletter } from "./data/Newsletter";
import { ReviewForm } from "./data/ReviewForm.ts";

document.addEventListener("alpine:init", () => {
  Alpine.plugin(Portal);
  Alpine.plugin(StickyScroll);
  Alpine.plugin(persist);
  Alpine.plugin(morph);
  Alpine.plugin(ElementTransition);
  Alpine.plugin(ElementIntersection);
  Alpine.plugin(Pagination);
  Alpine.plugin(Accessibility);

  Alpine.store("popup", PopupStore);
  Alpine.store("main", Main);
  Alpine.store("resizable", ResizableStore);
  Alpine.store("productList", ProductListStore);
  Alpine.store("cart", CartStore);

  Alpine.data("TransitionPreview", TransitionPreview);
  Alpine.data("BeforeAfter", BeforeAfter);
  Alpine.data("ProductList", ProductList);
  Alpine.data("Filters", Filters);
  Alpine.data("ProductPage", ProductPage);
  Alpine.data("DownloadableProduct", DownloadableProduct);
  Alpine.data("RecentOrders", RecentOrders);
  Alpine.data("Dropdown", Dropdown);
  Alpine.data("Search", Search);
  Alpine.data("Shipping", Shipping);
  Alpine.data("Accordion", Accordion);
  Alpine.data("Address", Address);
  Alpine.data("RangeSlider", RangeSlider);
  Alpine.data("Slider", Slider);
  Alpine.data("CountdownTimer", CountdownTimer);
  Alpine.data("TransitionImage", TransitionImage);
  Alpine.data("Authentication", Authentication);
  Alpine.data("Gallery", Gallery);
  Alpine.data("Newsletter", Newsletter);
  Alpine.data("ReviewForm", ReviewForm);
});
