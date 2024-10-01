import { ProductListType } from "./ProductList";

export type FiltersType = {
  [key: string | symbol]: any;
  selectedFilters: Record<string, string>;

  init(): void;
  selectFilter(filterName: string, filterUrl: string): void;
  applyFilters(filterName: string): void;
} & ProductListType;

const POPUP_FILTERS = "filters";
const POPUP_BOTTOM_FILTERS = "bottom-filters";

export const FILTER_SORT = "sort_by";
export const FILTER_PRICE = "Price";
export const FILTER_PRICE_PARAM_NAME = "filter.v.price";
export const FILTER_PRICE_MIN = "filter.v.price.gte";
export const FILTER_PRICE_MAX = "filter.v.price.lte";

export const Filters = () =>
  <FiltersType>{
    selectedFilters: {},

    init() {},

    selectFilter(filterName, filterUrl) {
      console.log("selecting filter", this.selectedFilters);
      this.selectedFilters[filterName] = filterUrl;

      if (!Alpine.store("main").isMobile) {
        this.applyFilters(filterName);
      }
    },

    applyFilters(filterName) {
      const filterUrl = this.selectedFilters[filterName];

      if (filterUrl) {
        // Replace with transition
        window.location.href = filterUrl;
      }
    },
  };
