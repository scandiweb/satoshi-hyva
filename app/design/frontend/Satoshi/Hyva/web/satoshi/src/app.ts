import "../theme/app.scss";
import persist from "@alpinejs/persist";
import morph from "@alpinejs/morph";

import elementTransition from "./plugins/Transition";
import elementIntersection from "./plugins/Intersect";
import pagination from "./plugins/Pagination";
import Portal from "./plugins/Portal";

import { PopupStore } from "./store/Popup";
import { ResizableStore } from "./store/Resizable";
import { PopupProductDetailsStore } from "./store/PopupProductDetails";
import { ProductListStore } from "./store/ProductList";

import { Main } from "./store/Main";
import { Cart } from "./data/Cart";
import { CartItem } from "./data/CartItem";
import { ProductList } from "./data/ProductList";
import { Filters } from "./data/Filters";
import { ProductPage } from "./data/ProductPage";
import { Search } from "./data/Search";
import { Accordion } from "./data/Accordion";
import { RangeSlider } from "./data/RangeSlider";
import { Slider } from "./data/Slider";

document.addEventListener("alpine:init", () => {
    Alpine.plugin(Portal);
    Alpine.plugin(persist);
    Alpine.plugin(morph);
    Alpine.plugin(elementTransition);
    Alpine.plugin(elementIntersection);
    Alpine.plugin(pagination);

    Alpine.store("popup", PopupStore);
    Alpine.store("main", Main);
    Alpine.store("resizable", ResizableStore);
    Alpine.store("popupProductDetails", PopupProductDetailsStore);
    Alpine.store("productList", ProductListStore);

    Alpine.data("Cart", Cart);
    Alpine.data("CartItem", CartItem);
    Alpine.data("ProductList", ProductList);
    Alpine.data("Filters", Filters);
    Alpine.data("ProductPage", ProductPage);
    Alpine.data("Search", Search);
    Alpine.data("Accordion", Accordion);
    Alpine.data("RangeSlider", RangeSlider);
    Alpine.data("Slider", Slider);
  });