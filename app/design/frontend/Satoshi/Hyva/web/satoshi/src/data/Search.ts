import type { Magics } from "alpinejs";
import { navigateWithTransition } from "../plugins/Transition";
import { productsQuery } from "../graphql/fetchProducts";

export type SearchType = {
  [key: string | symbol]: any;

  isLoading: boolean;
  searchTerm: string;
  searchTermInput: string;
  queries: [];
  products: [];
  categories: [];
  isNoResults: boolean;

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
    queries: [],
    products: [],
    categories: [],
    isNoResults: false,

    getIsSearchActive() {
      return !!this.searchTerm && (this.products.length || this.isNoResults);
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

      // TODO!: Implement queries/suggestions, and categories
      const url =
        "/graphql?" +
        new URLSearchParams({
          query: productsQuery(this.searchTerm, this.productsSearchLimit),
        });

      fetch(url)
        .then((response) => response.json())
        .then(({ data }) => {
          const {
            products: { items },
          } = data;

          this.products = items;
          this.isNoResults = !this.products.length;
        })
        .catch((error) => console.error("Error:", error))
        .finally(() => (this.isLoading = false));
    },

    goToSearchPage(path) {
      // TODO: implement fallback
      navigateWithTransition(this.getSearchUrl(path), {
        type: "search",
        animate: true,
        data: {
          search: this.searchTermInput,
        },
      });
    },

    getSearchUrl(path) {
      return this.searchTermInput
        ? `${path}?q=${encodeURIComponent(this.searchTermInput.trim())}`
        : path;
    },
  };
