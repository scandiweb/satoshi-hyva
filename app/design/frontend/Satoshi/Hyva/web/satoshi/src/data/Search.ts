import type { Magics } from "alpinejs";
import { productsQuery } from "../graphql/fetchProducts";

export type SearchType = {
  [key: string | symbol]: any;

  isLoading: boolean;
  searchTerm: string;
  searchTermInput: string;
  products: [];
  productsSearchLimit: number;

  init(): void;
  getIsSearchActive(): boolean;
  setSearchTerm(): void;
  resetSearchTerm(): void;
  search(): void;
  getSearchUrl(path: string): string;
  handleSearchSuggestionClick(term: string): void;
} & Magics<{}>;

export const Search = () =>
  <SearchType>{
    isLoading: false,
    searchTerm: "",
    searchTermInput: "",
    products: [],
    productsSearchLimit: 8,

    getIsSearchActive() {
      return !!this.searchTerm && (this.products.length > 0 || !this.isLoading);
    },

    init() {
      this.$watch("searchTerm", (value) => {
        if (value) {
          this.search();
        } else {
          this.suggestions = [];
        }
      });

      this.$watch("$store.popup.currentPopup", (value, oldValue) => {
        if (oldValue === "menu" && oldValue !== value) {
          this.resetSearchTerm();
        }
      });

      this.$watch("$store.resizable._current", (value) => {
        if (!value["search-desktop"]) {
          this.resetSearchTerm();
        }
      });
    },

    setSearchTerm() {
      this.searchTerm = this.searchTermInput.trim();
      this.isLoading = true;
    },

    resetSearchTerm() {
      this.searchTermInput = "";
      this.setSearchTerm();
      this.isLoading = false;
    },

    search() {
      this.isLoading = true;
      const url = '/graphql?' + new URLSearchParams({ query: productsQuery(this.searchTerm, this.productsSearchLimit) });

      fetch(url)
        .then((response) => response.json())
        .then(({data}) => {
          const { products: { items } } = data;

          this.products = items;
        })
        .catch((error) => console.error("Error:", error))
        .finally(() => (this.isLoading = false));
    },

    getSearchUrl(path) {
      return this.searchTerm
        ? `${path}?q=${encodeURIComponent(this.searchTerm)}`
        : path;
    },
  };
