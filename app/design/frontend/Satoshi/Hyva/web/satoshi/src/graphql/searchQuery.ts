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
                image {
                    url,
                    label
                },
                url_rewrites {
                    url
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
