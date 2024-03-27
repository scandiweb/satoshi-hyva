import type { Alpine as AlpineType } from "alpinejs";

const appendPaginationContent = (rawContent: string) => {
  const regex =
    /<!-- pagination-content -->([\s\S]*?)<!-- end-pagination-content -->/g;
  const content = rawContent.match(regex);
  const newContent = content ? content[0] : "";
  const el = document.querySelector("[data-content-wrapper]");

  if (el) {
    el.innerHTML += newContent;
  }
};

const fetchPage = (url: string) => {
  return fetch(url).then((res) => {
    if (res.ok) {
      return res.text();
    }

    throw new Error("Failed to get page");
  });
};

export default function (Alpine: AlpineType) {
  let isPaginating = false;
  let currentPage = parseInt(
    new URLSearchParams(window.location.search).get("page") || "1"
  );

  Alpine.directive(
    "pagination-trigger",
    (el, { expression }, { evaluate, cleanup }) => {
      const { lastPage } = evaluate(expression) as Record<string, number>;

      const onClick = async (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isPaginating) {
          return;
        }

        isPaginating = true;

        if (currentPage < lastPage) {
          const nextPage = currentPage + 1;
          const nextUrl = `${window.location.pathname}?page=${nextPage}`;
          const html = await fetchPage(nextUrl);
          appendPaginationContent(html);
          currentPage = nextPage;

          if (nextPage === lastPage) {
            el.remove();
          }
        }

        isPaginating = false;
      };

      el.addEventListener("click", onClick);

      cleanup(() => {
        el.removeEventListener("click", onClick);
        isPaginating = false;
        currentPage = parseInt(
          new URLSearchParams(window.location.search).get("page") || "1"
        );
      });
    }
  );
}
