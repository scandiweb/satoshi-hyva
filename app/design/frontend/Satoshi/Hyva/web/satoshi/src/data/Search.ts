import type { Magics } from "alpinejs";
import { navigateWithTransition } from "../plugins/Transition";
import { searchQuery } from "../graphql/searchQuery";

export type SearchType = {
  [key: string | symbol]: any;

  isLoading: boolean;
  searchTerm: string;
  searchTermInput: string;
  suggestions: [];
  products: [];
  categories: [];
  isNoResults: boolean;
  productsSearchLimit: number;

  init(): void;
  getIsSearchActive(): boolean;
  setSearchTerm(): void;
  resetSearchTerm(): void;
  search(): void;
  getSearchUrl(path: string): string;
  goToSearchPage(path: string): void;
} & Magics<{}>;

const initialSearch = new URLSearchParams(window.location.search).get("q");

export const Search = () =>
  <SearchType>{
    isLoading: false,
    searchTerm: initialSearch || "",
    searchTermInput: initialSearch || "",
    suggestions: [],
    products: [],
    categories: [],
    isNoResults: false,
    productsSearchLimit: 4,

    getIsSearchActive() {
      return !!this.searchTerm.length;
    },

    init() {
      if (this.searchTerm) {
        this.search();
      }

      this.$watch("searchTerm", (value) => {
        if (value) {
          this.search();
        }
      });
    },

    setSearchTerm() {
      if (this.searchTerm.trim() !== this.searchTermInput.trim()) {
        this.isLoading = true;
      }

      this.searchTerm = this.searchTermInput.trim();
    },

    resetSearchTerm() {
      this.searchTermInput = "";
      this.setSearchTerm();
      this.isLoading = false;
    },

    search() {
      this.isLoading = true;

      const url =
        "/graphql?" +
        new URLSearchParams({
          query: searchQuery(this.searchTerm, this.productsSearchLimit),
        });

      fetch(url)
        .then((response) => response.json())
        .then(({ data }) => {
          const {
            products: { items, suggestions },
            categories: { items: categories = [] } = {},
          } = data;

          this.products = this.searchTerm.length >= 3 ? items : [];
          this.suggestions = suggestions;
          this.categories = categories;
          this.isNoResults =
            !this.suggestions.length &&
            !this.products.length &&
            !this.categories.length;
        })
        .catch((error) => console.error("Error:", error))
        .finally(() => (this.isLoading = false));
    },

    goToSearchPage(path) {
      navigateWithTransition(this.getSearchUrl(path), {
        type: "search",
        animate: true,
        data: {
          q: this.searchTermInput,
        },
      });
    },

    getSearchUrl(path) {
      return this.searchTermInput
        ? `${path}?q=${encodeURIComponent(this.searchTermInput.trim())}`
        : path;
    },
  };
