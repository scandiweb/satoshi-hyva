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
