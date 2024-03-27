
export const productsQuery = (term: string, size: number) => {
    return `{
        products(
            search: ${term},
            pageSize: ${size}
        ) {
        items {
            id
            name
            sku,
            small_image {
                url,
                label
            },
            url_key,
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
    }`;
}
