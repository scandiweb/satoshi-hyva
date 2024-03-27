import { ProductListType } from "./ProductList";

type RemovedAttributesType = {
  [key: string]: string;
};

export type FiltersType = {
  [key: string | symbol]: any;

  currentName: string;
  searchQuery: string;
  isTopLevel: boolean;
  isTopFilterVisible: null | boolean;

  init(): void;
  onResetButtonClick(): void;
  showFilters(isTopLevel?: boolean, currentName?: string): void;
  hideFilters(): void;
  updateFilters(removedAttr?: RemovedAttributesType): void;
  removeFilter(name: string, value?: string): void;
  resetCurrent(): void;

  _isFilterEmptyOrDefault(key: string, value: string): boolean;
  _isFilterRemoved(
    key: string,
    value: string,
    removedAttr: RemovedAttributesType
  ): boolean;
} & ProductListType;

const POPUP_FILTERS = "filters";
const POPUP_BOTTOM_FILTERS = "bottom-filters";

export const FILTER_SORT = "sort_by";
export const FILTER_PRICE = "Price";
export const FILTER_PRICE_MIN = "filter.v.price.gte";
export const FILTER_PRICE_MAX = "filter.v.price.lte";

export const Filters = (
  defaultSort: string | unknown,
  minPrice: string | unknown,
  maxPrice: string | unknown
) =>
  <FiltersType>{
    currentName: "",
    searchQuery: "",
    isTopLevel: true,
    isTopFilterVisible: null,

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
      this.$store.popup.showPopup(POPUP_FILTERS);
    },

    hideFilters() {
      this.$store.popup.hidePopup(POPUP_FILTERS);
      this.isTopLevel = false;
      this.currentName = "";
    },

    updateFilters(removedAttr: RemovedAttributesType = {}) {
      const formData = new FormData(this.$refs.FilterForm as HTMLFormElement);
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

    resetCurrent() {
      const filterWrapper = this.$refs[`Filter${this.currentName}`];

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
        }
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
      removedAttr: RemovedAttributesType
    ) {
      if (!(key in removedAttr)) {
        return false;
      }

      return !removedAttr[key] || value == removedAttr[key];
    },
  };
