import type {Magics} from "alpinejs";

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

        _fetchPage(queryString) {
            this.isLoadingProducts = true;

            // If queryString is empty, set it to "?" to avoid browser caching of old query parameters.
            // This ensures that the fetch request is recognized as a new request.
            if (queryString === "") {
                queryString = "?";
            }

            fetch(`${path}${queryString}`, {
                method: 'GET',
            })
                .then(result => result.text())
                .then(body => {
                    hyva.replaceDomElement('#ProductGridContainer', body);
                    history.replaceState(
                        history.state,
                        "",
                        queryString || location.pathname,
                    );

                })
                .catch(error => {
                    console.error(error);
                    window.location.reload()
                })

        },
    };
};
