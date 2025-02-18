import { navigateWithTransition } from "../plugins/Transition";
import { ProductListType } from "./ProductList";

export type FiltersType = {
  [key: string | symbol]: any;
  selectedFilters: Record<string, string>;
  selectedSort: Record<string, string>;
  isTopLevel: boolean;
  currentName: string;
  isTopFilterVisible: null | boolean;

  init(): void;
  selectSort(sortKey: string, sortDir: string): void;
  applySort(): void;
  removeSort(): void;
  selectFilter(filterName: string, filterValue: string, filterUrl: string, isRadioType: boolean): void;
  applyFilters(filterName: string, filterValue: string, isRadioType: boolean): void;
  showFilters(isTopLevel?: boolean, currentName?: string): void;
  hideFilters(): void;
  onResetButtonClick(): void;
  clearAllFilters(): void;
  isFilterSelected(filterKey: string): boolean;
  loadSelectedFilters(): void;
} & ProductListType;

const POPUP_FILTERS = "filters";
const POPUP_BOTTOM_FILTERS = "bottom-filters";

export const FILTER_SORT_KEY = "product_list_order";
export const FILTER_SORT_DIR = "product_list_dir";
export const FILTER_PRICE = "Price";
export const FILTER_PRICE_PARAM_NAME = "filter.v.price";
export const FILTER_PRICE_MIN = "filter.v.price.gte";
export const FILTER_PRICE_MAX = "filter.v.price.lte";

export const modifyUrlParams = (
  url: string,
  params: Record<string, string>,
  removeParams?: string[],
) => {
  const parsedUrl = new URL(url);
  const searchParams = parsedUrl.searchParams;

  // Add or update params
  for (const [key, value] of Object.entries(params)) {
    if (searchParams.has(key)) {
      if (searchParams.get(key) !== value) {
        searchParams.set(key, value);
      }
    } else {
      searchParams.append(key, value);
    }
  }

  // remove params
  removeParams?.forEach((param) => {
    if (searchParams.has(param)) {
      searchParams.delete(param);
    }
  });

  parsedUrl.search = searchParams.toString();

  return parsedUrl.toString();
};

export const Filters = (
  clearUrl: string,
  initialSort: Record<string, string>,
) =>
  <FiltersType>{
    selectedFilters: {},
    selectedSort: initialSort,
    isTopLevel: false,
    currentName: "",
    isTopFilterVisible: null,

    init() {
      this.loadSelectedFilters();

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

      this.$watch("isTopFilterVisible", (value) => {
        if (value) {
          Alpine.store("popup").hidePopup(POPUP_BOTTOM_FILTERS);
        } else {
          Alpine.store("popup").showPopup(POPUP_BOTTOM_FILTERS, false);
        }
      });

      this.$watch("$store.popup.currentPopup", (value) => {
        if (value === POPUP_BOTTOM_FILTERS && this.isTopFilterVisible) {
          Alpine.store("popup").hidePopup(POPUP_BOTTOM_FILTERS);
        }
      });
    },

    selectSort(sortKey, sortDir) {
      this.selectedSort = {
        key: sortKey,
        dir: sortDir,
      };

      if (!Alpine.store("main").isMobile) {
        this.applySort();
      }
    },

    applySort() {
      const url = window.location.href;

      this.hideFilters();
      if (this.selectedSort.key && this.selectedSort.dir) {
        const newUrl = modifyUrlParams(url, {
          [FILTER_SORT_KEY]: this.selectedSort.key,
          [FILTER_SORT_DIR]: this.selectedSort.dir,
        });
        navigateWithTransition(newUrl);
      }
    },

    removeSort() {
      const url = window.location.href;

      const newUrl = modifyUrlParams(url, {}, [
        FILTER_SORT_KEY,
        FILTER_SORT_DIR,
      ]);
      navigateWithTransition(newUrl);
    },

    selectFilter(filterName, filterValue, filterUrl, isRadioType = false) {
      this.selectedFilters[filterName + filterValue] = filterUrl;

      if (!Alpine.store("main").isMobile) {
        this.applyFilters(filterName, filterValue, isRadioType);
      }
    },

    applyFilters(filterName, filterValue = '', isRadioType = false) {
      const url = window.location.href;

      this.hideFilters();
      if (filterName === "Sort by") {
        const newUrl = modifyUrlParams(url, {
          [FILTER_SORT_KEY]: this.selectedSort.key,
          [FILTER_SORT_DIR]: this.selectedSort.dir,
        });
        return navigateWithTransition(newUrl);
      }

      if (isRadioType) {
        const filterUrl = this.selectedFilters[filterName + filterValue];
        if (filterUrl) navigateWithTransition(filterUrl);
        return;
      }

      if (filterValue && this.isFilterSelected(filterName + filterValue)) {
        const parsedUrl = new URL(url);
        const queryParams = parsedUrl.searchParams;
        const selectedValues = queryParams.get(filterName);

        if (selectedValues) {
          const selectedValuesArray = selectedValues.split(',').filter(value => value !== filterValue);
          if (selectedValuesArray.length > 0) {
            queryParams.set(filterName, selectedValuesArray.join(','));
          } else {
            queryParams.delete(filterName);
          }
        }

        const newUrl = parsedUrl.toString();
        return navigateWithTransition(decodeURIComponent(newUrl));
      }

      const filterUrl = this.selectedFilters[filterName + filterValue];
      if (filterUrl) {
        navigateWithTransition(filterUrl);
      }
    },

    showFilters(isTopLevel = true, currentName = "") {
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
      this.clearAllFilters();
    },

    clearAllFilters() {
      const url = modifyUrlParams(clearUrl, {}, [
        FILTER_SORT_KEY,
        FILTER_SORT_DIR,
      ]);

      navigateWithTransition(url);
    },

    isFilterSelected(filterKey) {
      return this.selectedFilters.hasOwnProperty(filterKey);
    },

    loadSelectedFilters() {
      const url = window.location.href;
      const parsedUrl = new URL(url);
      const searchParams = parsedUrl.searchParams;

      searchParams.forEach((value, key) => {
        const filterValues = value.split(',');

        filterValues.forEach(filterValue => {
          this.selectedFilters[`${key}${filterValue}`] = url;
        });
      });
    },
  };
