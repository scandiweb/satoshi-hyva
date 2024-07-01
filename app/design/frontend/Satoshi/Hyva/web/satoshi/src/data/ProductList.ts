import type { Magics } from "alpinejs";
import { replaceElement } from "../utils/morph";

export type ProductListType = {
  [key: string | symbol]: any;

  isLoadingProducts: boolean;

  init(): void;
  resetAll(): void;
  _getSearchQuery(): string;
  _getSearchQueryString(): string;
  _fetchPage(queryString: string, isReset?: boolean): void;
} & Magics<{}>;

const SEARCH_QUERY_NAME = "q";

export const ProductList = (...args: unknown[]) => {
  const [path] = args;

  return <ProductListType>{
    isLoadingProducts: false,

    init() {
      this._fetchPage = this._fetchPage.bind(this);
    },

    resetAll() {
      this._fetchPage(this._getSearchQueryString(), true);
      this.$dispatch("reset-filters");
    },

    _getSearchQuery() {
      return (
        new URLSearchParams(window.location.search).get(SEARCH_QUERY_NAME) || ""
      );
    },

    _getSearchQueryString() {
      const searchValue = this._getSearchQuery();

      return searchValue ? `?${SEARCH_QUERY_NAME}=${searchValue}` : "";
    },

    _fetchPage(queryString, isReset = false) {
      this.isLoadingProducts = true;

      fetch(`${path}${queryString}`)
        .then((response) => response.text())
        .then((data) => {
          const resultHtml = document.createElement("div");
          resultHtml.innerHTML = data;

          const productGridHtml = resultHtml.querySelector(
            "#ProductGridContainer",
          );
          const productGridElem = this.$refs.ProductGridContainer;

          replaceElement(productGridElem, productGridHtml, isReset);

          // update url without refreshing the page
          history.replaceState(
            history.state,
            "",
            queryString || location.pathname,
          );
        })
        .catch((error) => console.error("Error:", error))
        .finally(() => (this.isLoadingProducts = false));
    },
  };
};
