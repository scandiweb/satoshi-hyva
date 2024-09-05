import type { Magics } from "alpinejs";
import { ESC_KEY } from "../utils/keyboard-keys";

export type DropdownType = {
  isDropdownVisible: boolean;
  _dropdownWrapper: HTMLElement | null;

  init(): void;
  _onClick(event: MouseEvent): void;
  _onKeydown(event: KeyboardEvent): void;

  toggleDropdown(): void;
  show(): void;
  hide(): void;
  search(value: string): void;
  fetchAndReplaceContent(url: string, targetSelector: string): void;
} & Magics<{}>;

export const Dropdown = () =>
  <DropdownType>{
    isDropdownVisible: false,
    _dropdownWrapper: null,
    _onClick: (_event) => {},
    _onKeydown: (_event) => {},

    init() {
      Alpine.nextTick(() => {
        this._dropdownWrapper = this.$refs.DropdownWrapper;
      });
    },

    toggleDropdown() {
      if (this.isDropdownVisible) {
        this.hide();
      } else {
        this.show();
      }
    },

    show() {
      this.isDropdownVisible = true;

      this._onClick = (e) => {
        if (!this._dropdownWrapper?.contains(e.target as Node)) {
          this.hide();
        }
      };

      // Hide when clicked outside
      document.addEventListener("click", this._onClick);

      this._onKeydown = (e) => {
        const isEscPressed = e.key === ESC_KEY;

        if (isEscPressed) {
          this.hide();
        }
      };

      // Hide when Esc is pressed
      document.addEventListener("keydown", this._onKeydown);
    },

    hide() {
      this.isDropdownVisible = false;

      document.removeEventListener("click", this._onClick);
      document.removeEventListener("keydown", this._onKeydown);
    },

    search(value) {
      const options = this._dropdownWrapper?.querySelectorAll("li a");
      options?.forEach((option) => {
        const optionValue = (option as HTMLElement).outerText.toLowerCase();
        const match = optionValue.includes(value.toLowerCase());

        option.classList.toggle("hidden", !match);
      });
    },

      /**
       * Fetches new content from the provided URL and replaces the content
       * within the specified target selector on the current page. If it fails,
       * redirects the browser to the URL as a fallback.
       *
       * @param {string} url - The URL from which to fetch the new content.
       * @param {string} targetSelector - The CSS selector for the element to replace (default is "document").
       */
      fetchAndReplaceContent(url, targetSelector = "document") {
          if (!url) {
              return;
          }

          let responseUrl = '';

          // Start the fetch process and automatically follow any redirects.
          fetch(url, { redirect: "follow" })
              .then((response) => {
                  this.hide();
                  responseUrl = response.url;

                  if (!response.ok) {
                      throw new Error(`Failed to fetch content. Status: ${response.status}`);
                  }

                  return response.text();
              })
              .then((data) => {
                  // Create a temporary container to parse the fetched HTML.
                  const resultHtml = document.createElement("div");
                  resultHtml.innerHTML = data;

                  let newContentHtml = resultHtml.querySelector(
                      targetSelector === "document" ? "body" : targetSelector
                  )?.innerHTML;

                  // Fallback: If no content is found, use the entire HTML structure.
                  if (!newContentHtml) {
                      newContentHtml = resultHtml.innerHTML;
                  }

                  const currentContentElem = document.querySelector(targetSelector === "document" ? "body" : targetSelector);

                  // If both the new content and the current content element exist, perform the replacement
                  if (newContentHtml && currentContentElem) {
                      currentContentElem.innerHTML = newContentHtml;
                  } else {
                      window.location.href = url;
                      return;
                  }

                  history.replaceState(history.state, "", responseUrl);
              })
              .catch(() => {
                  window.location.href = url;
              });
      },

  };
