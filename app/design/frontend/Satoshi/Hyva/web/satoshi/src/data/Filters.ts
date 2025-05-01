import { navigateWithTransition } from "../plugins/Transition";
import { ProductListType } from "./ProductList";

export type FiltersType = {
  [key: string | symbol]: any;
  selectedFilters: Record<string, string>;
  selectedFilterNames: string[];
  selectedSort: Record<string, string>;
  isTopLevel: boolean;
  currentName: string;
  currentFilterName: string;
  currentFilterValue: string;
  appliedFilterUrl: string;
  isTopFilterVisible: null | boolean;
  isDesktopContentInitialized: boolean;

  init(): void;
  initDesktopContent(): void;
  setupPopupWatcher(): void;
  selectSort(sortKey: string, sortDir: string): void;
  applySort(): void;
  removeSort(): void;
  selectFilter(filterName: string, filterValue: string, filterUrl: string, isRadioType?: boolean, isInputChecked?: boolean): void;
  applyFilters(filterName: string, filterValue: string, isRadioType?: boolean): void;
  showFilters(isTopLevel?: boolean, currentName?: string): void;
  hideFilters(): void;
  onResetButtonClick(): void;
  clearAllFilters(): void;
  isFilterSelected(filterKey: string): boolean;
  loadSelectedFilters(): void;
  updateFilterUrl(filterName: string, filterValue: string, filterUrl: string): string;
  updateMobileFilterUrl(filterName: string, filterValue: string): string;
  isFilterNameSelected(filterName: string): boolean;
  setSelectedFilterNames(filterKey: string, filterName: string): void;
} & ProductListType;

const POPUP_FILTERS = "filters";
const POPUP_BOTTOM_FILTERS = "bottom-filters";

export const FILTER_SORT_KEY = "product_list_order";
export const FILTER_SORT_DIR = "product_list_dir";
export const FILTER_PRICE = "Price";
export const FILTER_PRICE_PARAM_NAME = "price";

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
    selectedFilterNames: [] as string[],
    selectedSort: initialSort,
    isTopLevel: false,
    currentName: "",
    currentFilterName: "",
    appliedFilterUrl: "",
    currentFilterValue: "",
    isTopFilterVisible: null,
    isDesktopContentInitialized: false,

    init() {
      this.loadSelectedFilters();
      this.setupPopupWatcher();
      // By calling initDesktopContent method here we ensure that when switching from mobile to desktop
      // the desktop content gets initialized after Filters component is initialized
      this.initDesktopContent();
    },

    initDesktopContent() {
      if (!Alpine.store("main").isMobile && !this.isDesktopContentInitialized) {
        this.isDesktopContentInitialized = true;
      }
    },

    setupPopupWatcher() {
      // Change popup height on content change
      this.$watch("currentName", (value, oldValue) => {
        // Reset the updated filter URL when closing the current filter, specifically on mobile devices
        this.appliedFilterUrl = window.location.href;
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
      this.selectedSort = {key: sortKey, dir: sortDir};

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

    selectFilter(filterName, filterValue, filterUrl, isRadioType = false, isInputChecked = false) {
      this.selectedFilters[filterName + filterValue] = filterUrl;

      if (!isInputChecked && !isRadioType) {
        this.appliedFilterUrl = this.updateFilterUrl(filterName, filterValue, filterUrl);
      }

      if (Alpine.store("main").isMobile) {
        this.currentFilterName = filterName;
        this.currentFilterValue = filterValue;

        if (isRadioType) {
          return this.appliedFilterUrl = filterUrl;
        }

        if (isInputChecked) {
          return this.appliedFilterUrl = filterName ? this.updateMobileFilterUrl(filterName, filterValue) : filterUrl;
        }

        return;
      }

      this.applyFilters(filterName, filterValue, isRadioType);
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

      if (this.appliedFilterUrl && (Alpine.store("main").isMobile || !this.isFilterSelected(filterName + filterValue))) {
        return navigateWithTransition(this.appliedFilterUrl);
      }

      if (isRadioType) {
        const filterUrl = this.selectedFilters[filterName + filterValue];
        if (filterUrl) navigateWithTransition(filterUrl);
        return;
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
      this.selectedFilterNames = [];
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
      this.appliedFilterUrl = url;
      const parsedUrl = new URL(url);
      const searchParams = parsedUrl.searchParams;

      searchParams.forEach((value, key) => {
        const filterValues = value.split(',');

        filterValues.forEach(filterValue => {
          this.selectedFilters[`${key}${filterValue}`] = url;
        });
      });
    },

    updateFilterUrl(filterName: string, filterValue: string, filterUrl: string) {
      const parsedUrl = new URL(filterUrl);
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

      return decodeURIComponent(parsedUrl.toString());
    },

    // This method was created since on mobile we may apply multiple filters at once
    updateMobileFilterUrl(filterName: string, filterValue: string) {
      const parsedUrl = new URL(this.appliedFilterUrl || window.location.href);
      const queryParams = parsedUrl.searchParams;
      const selectedValues = queryParams.get(filterName);

      // If the filter already exists in the URL, we update it by adding the filterValue
      if (selectedValues) {
        const selectedValuesArray = selectedValues.split(',');
        if (!selectedValuesArray.includes(filterValue)) {
          selectedValuesArray.push(filterValue);
          queryParams.set(filterName, selectedValuesArray.join(','));
        }
      } else {
        // If the filter doesn't exist, create a new filter with the filterValue
        queryParams.append(filterName, filterValue);
      }

      return decodeURIComponent(parsedUrl.toString());
    },

    isFilterNameSelected(filterName) {
      return this.selectedFilterNames.includes(filterName);
    },

    setSelectedFilterNames(filterKey, filterName) {
      if (this.isFilterSelected(filterKey) && !this.isFilterNameSelected(filterName)) {
        return this.selectedFilterNames.push(filterName);
      }

      if (filterName === FILTER_PRICE && window.location.search.includes(FILTER_PRICE_PARAM_NAME)) {
        this.selectedFilterNames.push(filterName);
      }
    },
  };
