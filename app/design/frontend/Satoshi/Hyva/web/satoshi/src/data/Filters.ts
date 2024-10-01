import { ProductListType } from "./ProductList";

export type FiltersType = {
  [key: string | symbol]: any;
  selectedFilters: Record<string, string>;
  isTopLevel: boolean;
  currentName: string;

  init(): void;
  selectFilter(filterName: string, filterUrl: string): void;
  applyFilters(filterName: string): void;
  showFilters(isTopLevel: boolean, currentName: string): void;
  hideFilters(): void;
  onResetButtonClick(): void;
} & ProductListType;

const POPUP_FILTERS = "filters";
const POPUP_BOTTOM_FILTERS = "bottom-filters";

export const FILTER_SORT = "sort_by";
export const FILTER_PRICE = "Price";
export const FILTER_PRICE_PARAM_NAME = "filter.v.price";
export const FILTER_PRICE_MIN = "filter.v.price.gte";
export const FILTER_PRICE_MAX = "filter.v.price.lte";

export const Filters = (clearUrl: string) =>
  <FiltersType>{
    selectedFilters: {},
    isTopLevel: false,
    currentName: "",

    init() {
      // Change popup height on content change
      this.$watch("currentName", (value, oldValue) => {
        if (value != oldValue) {
          this.$nextTick(() => {
            // setTimeout fixes content height calculations in some cases
            setTimeout(() => {
              Alpine.store("popup").updateContentSize();
            }, 50);
          });
        }
      });

      // this.$watch("isTopFilterVisible", (value) => {
      //   if (value) {
      //     Alpine.store("popup").hidePopup(POPUP_BOTTOM_FILTERS);
      //   } else {
      //     Alpine.store("popup").showPopup(POPUP_BOTTOM_FILTERS, false);
      //   }
      // });

      // this.$watch("$store.popup.currentPopup", (value) => {
      //   if (value === POPUP_BOTTOM_FILTERS && this.isTopFilterVisible) {
      //     Alpine.store("popup").hidePopup(POPUP_BOTTOM_FILTERS);
      //   }
      // });
    },

    selectFilter(filterName, filterUrl) {
      this.selectedFilters[filterName] = filterUrl;

      if (!Alpine.store("main").isMobile) {
        this.applyFilters(filterName);
      }
    },

    applyFilters(filterName) {
      const filterUrl = this.selectedFilters[filterName];
      this.hideFilters();

      if (filterUrl) {
        // TODO: Replace with transition
        window.location.href = filterUrl;
      }
    },

    showFilters(isTopLevel, currentName) {
      this.isTopLevel = isTopLevel;
      this.currentName = currentName;
      Alpine.store("popup").showPopup(POPUP_FILTERS, true);
    },

    hideFilters() {
      this.$store.popup.hidePopup(POPUP_FILTERS);
      this.isTopLevel = false;
      this.currentName = "";
    },

    onResetButtonClick() {
      this.hideFilters();
      if (this.isTopLevel) {
        // TODO: Replace with transition
        window.location.href = clearUrl;
      }
    },
  };
