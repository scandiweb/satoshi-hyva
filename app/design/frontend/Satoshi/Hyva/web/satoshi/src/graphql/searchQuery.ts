import { sanitize } from "../utils/sanitize";

export const searchQuery = (term: string, size: number) => {
  return `{
        products(
            search: "${sanitize(term)}",
            pageSize: ${size}
        ) {
            suggestions {
                search
            }
            items {
                id
                name
                sku,
                url_rewrites {
                    url
                },
                media_gallery {
                    url,
                    label
                },
                price_range {
                    minimum_price {
                        regular_price {
                            value
                            currency
                        }
                        final_price {
                            value
                            currency
                        }
                    }
                    maximum_price {
                        regular_price {
                            value
                            currency
                        }
                        final_price {
                            value
                            currency
                        }
                    }
                }
            }
        }
        ${
          term.length >= 3
            ? `
            categories(
                filters: {
                    name: {
                        match: "${sanitize(term)}"
                    }
                },
                pageSize: ${size}
            ) {
                items {
                    name
                    url_path
                }
            }
        `
            : ""
        }
    }`;
};
