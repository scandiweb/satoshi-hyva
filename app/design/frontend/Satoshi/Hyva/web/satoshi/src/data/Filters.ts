import { ProductListType } from "./ProductList";
import { formatPrice } from "../utils/price";

export type FilterValueType = {
  label: string;
  value: string;
  param_name: string;
};

export type FilterType = {
  type: string;
  label: string;
  param_name: string;
  active_values: FilterValueType[];
  min_value: FilterValueType;
  max_value: FilterValueType;
  values: FilterValueType[];
};

export type SortOptionType = {
  value: string;
  name: string;
};

type RemovedAttributesType = {
  [key: string]: string;
};

export type FiltersType = {
  [key: string | symbol]: any;

  currentName: string;
  searchQuery: string;
  isTopLevel: boolean;
  isTopFilterVisible: null | boolean;
  filters: FilterType[] | [];
  sortOptions: SortOptionType[] | [];
  sortBy: string | boolean;

  init(): void;
  onResetButtonClick(): void;
  showFilters(isTopLevel?: boolean, currentName?: string): void;
  hideFilters(): void;
  getPriceFilter(): FilterType;
  getFormattedMinPrice(): string;
  getFormattedMaxPrice(): string;
  resetSelectedFiltersState(): void;
  setSortBy(value: string): void;
  getSelectedSortOption(): SortOptionType;
  getIsFilterValueSelected(param_name: string, value: string): boolean;
  getIsFilterSelected(param_name: string): boolean;
  getIsDefault(): boolean;
  updateFilters(removedAttr?: RemovedAttributesType): void;
  removeFilter(name: string, value?: string): void;
  resetCurrent(): void;

  _isFilterEmptyOrDefault(key: string, value: string): boolean;
  _isFilterRemoved(
    key: string,
    value: string,
    removedAttr: RemovedAttributesType,
  ): boolean;
} & ProductListType;

const POPUP_FILTERS = "filters";
const POPUP_BOTTOM_FILTERS = "bottom-filters";

export const FILTER_SORT = "product_list_order";
export const FILTER_PRICE = "Price";
export const FILTER_PRICE_PARAM_NAME = "filter.v.price";
export const FILTER_PRICE_MIN = "filter.v.price.gte";
export const FILTER_PRICE_MAX = "filter.v.price.lte";

export const Filters = (
  sortOptions: [],
  defaultSort: string | unknown,
  minPrice: string | unknown,
  maxPrice: string | unknown,
  currency: string,
) =>
  <FiltersType>{
    currentName: "",
    searchQuery: "",
    isTopLevel: true,
    isTopFilterVisible: null,
    filters: [],
    sortOptions: sortOptions,
    // If the default sort option is selected, then this.sortBy will be false.
    // otherwise, this.sortBy will have the string value of the selected sort option.
    sortBy: false,

    init() {
      this.updateFilters = this.updateFilters.bind(this);
      this.onResetButtonClick = this.onResetButtonClick.bind(this);

      this.searchQuery = this._getSearchQuery();

      // Change popup height on content change
      this.$watch("currentName", (value, oldValue) => {
        if (value != oldValue) {
          this.$nextTick(() => {
            // setTimeout fixes content height calculations in some cases
            setTimeout(() => {
              this.$store.popup.updateContentSize();
            }, 50);
          });
        }
      });

      this.$watch("isTopFilterVisible", (value) => {
        if (value) {
          this.$store.popup.hidePopup(POPUP_BOTTOM_FILTERS);
        } else {
          this.$store.popup.showPopup(POPUP_BOTTOM_FILTERS, false);
        }
      });

      this.$watch("$store.popup.currentPopup", (value) => {
        if (value === POPUP_BOTTOM_FILTERS && this.isTopFilterVisible) {
          this.$store.popup.hidePopup(POPUP_BOTTOM_FILTERS);
        }
      });
    },

    onResetButtonClick() {
      if (this.isTopLevel) {
        this.resetAll();
        this.hideFilters();
      } else {
        this.resetCurrent();
      }
    },

    showFilters(isTopLevel = true, currentName = "") {
      this.isTopLevel = isTopLevel;
      this.currentName = currentName;
      this.$store.popup.showPopup(POPUP_FILTERS, true);
    },

    hideFilters() {
      this.$store.popup.hidePopup(POPUP_FILTERS);
      this.isTopLevel = false;
      this.currentName = "";
    },

    getPriceFilter() {
      return this.filters.find((f) => f.param_name === FILTER_PRICE_PARAM_NAME);
    },

    getFormattedMinPrice() {
      return formatPrice(
        parseFloat(this.getPriceFilter().min_value.value),
        currency,
      );
    },

    getFormattedMaxPrice() {
      return formatPrice(
        parseFloat(this.getPriceFilter().max_value.value),
        currency,
      );
    },

    // Remove all of the selected filters from this.filters and this.sortBy
    // This function only changes the state data. so it only affects the UI.
    resetSelectedFiltersState() {
      this.filters.forEach((filter: FilterType) => {
        if (filter.param_name === FILTER_PRICE_PARAM_NAME) {
          filter.min_value.value = "";
          filter.max_value.value = "";
        } else {
          filter.active_values = [];
        }
      });

      this.sortBy = false;
    },

    setSortBy(value: string) {
      this.sortBy = value || false;

      if (this.sortBy === defaultSort) {
        this.sortBy = false;
      }
    },

    getSelectedSortOption() {
      if (this.sortBy) {
        return this.sortOptions.find((option) => option.value === this.sortBy);
      } else {
        return this.sortOptions.find((option) => option.value === defaultSort);
      }
    },

    // Determine if a specific filter value is selected or not. For example it can be used to see if a filter checkbox/radio should be checked or not.
    getIsFilterValueSelected(param_name: string, value: string) {
      if (param_name === FILTER_SORT) {
        return this.getSelectedSortOption().value === value;
      } else {
        const filter = this.filters.find(
          (filter) => filter.param_name === param_name,
        );
        const activeValue = filter?.active_values.find(
          (a) => a.value === value,
        );
        return Boolean(activeValue);
      }
    },

    // Determine if a specific filter is selected or not. For example it can be used to check if "reset" button should be rendered or not.
    getIsFilterSelected(param_name: string) {
      if (param_name === FILTER_SORT) {
        return Boolean(this.sortBy);
      } else if (param_name === FILTER_PRICE_PARAM_NAME) {
        const priceFilter = this.getPriceFilter();
        return (
          Boolean(priceFilter.min_value.value) ||
          Boolean(priceFilter.max_value.value)
        );
      } else {
        const filter = this.filters.find(
          (filter) => filter.param_name === param_name,
        );
        return Boolean(filter?.active_values.length);
      }
    },

    // If there is no filter selected then isDefault is true otherwise it's false.
    getIsDefault() {
      let isDefault = true;

      this.filters.forEach((filter) => {
        if (filter.param_name === FILTER_PRICE_PARAM_NAME) {
          if (filter.min_value.value || filter.max_value.value) {
            isDefault = false;
          }
        } else {
          if (filter.active_values.length) {
            isDefault = false;
          }
        }
      });

      if (this.sortBy) {
        isDefault = false;
      }

      return isDefault;
    },

    updateFilters(removedAttr: RemovedAttributesType = {}) {
      const form = document.getElementById("FilterForm");
      const formData = new FormData(form as HTMLFormElement);
      let urlParams = new URLSearchParams(formData as any);

      // Remove empty filter values and attributes that equal default value
      [...urlParams.entries()].forEach(([key, value]) => {
        if (this._isFilterEmptyOrDefault(key, value)) {
          urlParams.delete(key);
          return;
        }

        if (this._isFilterRemoved(key, value, removedAttr)) {
          const paramValues = urlParams.getAll(key);
          urlParams.delete(key);

          if (value && paramValues.length > 1) {
            paramValues.forEach((paramValue) => {
              if (paramValue !== value) {
                urlParams.append(key, paramValue);
              }
            });
          }
        }
      });

      urlParams.sort();
      const queryString = urlParams.toString()
        ? `?${urlParams.toString()}`
        : "";

      if (queryString === window.location.search) {
        return;
      }

      // Remove old selected filters from this.filters and this.sortBy
      this.resetSelectedFiltersState();

      // Add the new selected filters to this.filters and this.sortBy
      [...urlParams.entries()].forEach(([key, value]) => {
        if (key === FILTER_SORT) {
          this.setSortBy(value);
        } else if (key === FILTER_PRICE_MIN) {
          this.getPriceFilter().min_value.value = value;
        } else if (key === FILTER_PRICE_MAX) {
          this.getPriceFilter().max_value.value = value;
        } else {
          const filter = this.filters.find((f) => f.param_name === key);
          const label =
            filter?.values.find(
              (v) => v.param_name === key && v.value === value,
            )?.label || "";
          filter?.active_values.push({
            label,
            param_name: key,
            value,
          });
        }
      });

      this._fetchPage(queryString, !!Object.keys(removedAttr).length);

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 300);
    },

    removeFilter(name: string, value: string = "") {
      this.updateFilters({ [name]: value });
      this.$dispatch("reset-filters", { name: name });
    },

    resetCurrent(filterWrapperId?: string) {
      const filterWrapper = document.getElementById(
        filterWrapperId || `filter-${this.currentName.toLowerCase()}`,
      );

      if (!filterWrapper) {
        return;
      }

      let removedAttr: RemovedAttributesType = {};

      Array.from(filterWrapper.getElementsByTagName("input")).forEach(
        (item) => {
          if (
            item.name &&
            item.value &&
            !removedAttr.hasOwnProperty(item.name)
          ) {
            removedAttr[item.name] = "";
          }
        },
      );

      if (Object.keys(removedAttr).length) {
        this.updateFilters(removedAttr);
        this.$dispatch("reset-filters", { name: this.currentName });
      }
    },

    _isFilterEmptyOrDefault(key: string, value: string) {
      return (
        !value ||
        (key === FILTER_SORT && value === String(defaultSort)) ||
        (key === FILTER_PRICE_MIN && value === String(minPrice)) ||
        (key === FILTER_PRICE_MAX && value === String(maxPrice))
      );
    },

    _isFilterRemoved(
      key: string,
      value: string,
      removedAttr: RemovedAttributesType,
    ) {
      if (!(key in removedAttr)) {
        return false;
      }

      return !removedAttr[key] || value == removedAttr[key];
    },
  };
