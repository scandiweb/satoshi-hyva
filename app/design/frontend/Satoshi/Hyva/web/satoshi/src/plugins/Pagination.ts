import type { Alpine as AlpineType } from "alpinejs";
import { cachePage, enableFadeInImages, fetchPage } from "./Transition";

const appendPaginationContent = (rawContent: string) => {
  const regex =
    /<!-- pagination-content -->([\s\S]*?)<!-- end-pagination-content -->/g;
  const content = rawContent.match(regex);
  const newContent = content ? content[0] : "";
  const el = document.querySelector("[data-content-wrapper]");

  const newElements = document.createElement("div");
  newElements.style.display = "contents";
  newElements.innerHTML = newContent;

  if (el) {
    el.appendChild(newElements);
  }
};

export default function (Alpine: AlpineType) {
  let isPaginating = false;
  let currentPage = parseInt(
    new URLSearchParams(window.location.search).get("p") || "1",
  );

  Alpine.directive(
    "pagination-trigger",
    (el, { expression }, { evaluate, cleanup }) => {
      const { lastPage } = evaluate(expression) as Record<string, number>;

      const onClick = async (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        enableFadeInImages();

        if (isPaginating) {
          return;
        }

        isPaginating = true;
        el.ariaBusy = "1";

        if (currentPage < lastPage) {
          const nextPage = currentPage + 1;
          const nextUrl = `${window.location.pathname}?p=${nextPage}`;
          const fullUrl = window.location.pathname + window.location.search;
          const html = await fetchPage(nextUrl);
          appendPaginationContent(html);
          cachePage(fullUrl, document.documentElement.outerHTML);
          history.replaceState({ page: nextPage }, "", fullUrl);
          currentPage = nextPage;

          if (nextPage === lastPage) {
            el.remove();
          }
        }

        isPaginating = false;
        el.ariaBusy = "0";
      };

      el.addEventListener("click", onClick);

      cleanup(() => {
        el.removeEventListener("click", onClick);
        isPaginating = false;
        currentPage = parseInt(
          new URLSearchParams(window.location.search).get("p") || "1",
        );
      });
    },
  );
}
