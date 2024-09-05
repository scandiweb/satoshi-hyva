import type { Magics } from "alpinejs";
import { ESC_KEY } from "../utils/keyboard-keys";
import { navigateWithTransition } from "../plugins/Transition";

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
  fetchAndReplaceContent(url: string, targetSelector: string, options: object): void;
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

      fetchAndReplaceContent (
          url: string,
          targetSelector: string = "document",
          options: {
              preview?: boolean;
              animate?: boolean;
              type?: string;
              data?: Record<string, any>;
              areaId?: string;
              target?: HTMLElement | null;
          } = {} ) {
          if (!url) {
              return;
          }

          let responseUrl = '';

          navigateWithTransition(url, options);

          // Fetch the new content, following any redirects automatically
          fetch(url, { redirect: "follow" })
              .then((response) => {
                  responseUrl = response.url;

                  if (!response.ok) {
                      throw new Error("Network response was not ok");
                  }

                  return response.text();
              })
              .then((data) => {
                  // Create a temporary container to hold the fetched HTML
                  const resultHtml = document.createElement("div");
                  resultHtml.innerHTML = data;

                  let newContentHtml = null;

                  if (targetSelector === "document") {
                      newContentHtml = resultHtml.querySelector("body")?.innerHTML;
                  } else {
                      newContentHtml = resultHtml.querySelector(targetSelector)?.innerHTML;
                  }

                  // Fallback: If the body or target content is not found, try using the entire fetched HTML structure
                  if (!newContentHtml) {
                      console.error("Body content not found. Trying entire HTML structure instead.");
                      newContentHtml = resultHtml.innerHTML;
                  }

                  // Select the current content element on the page based on the target selector
                  const currentContentElem = document.querySelector(targetSelector === "document" ? "body" : targetSelector);

                  // If both the new content and the current content element exist, perform the replacement
                  if (newContentHtml && currentContentElem) {
                      // Replace the content while keeping the outer <body> tag intact
                      currentContentElem.innerHTML = newContentHtml;

                      // Re-run all scripts after body replacement
                      // Array.from(document.querySelectorAll("script")).forEach(oldScript => {
                      //     const newScript = document.createElement("script");
                      //     if (oldScript.src) {
                      //         newScript.src = oldScript.src;
                      //     } else {
                      //         newScript.textContent = oldScript.textContent;
                      //     }
                      //     document.body.appendChild(newScript);
                      //     oldScript.remove();
                      // });
                  } else {
                      // Target content not found for replacement. Fallback to redirecting the user to the provided URL
                      window.location.href = url;
                      return;
                  }

                  history.replaceState(history.state, "", responseUrl);
              })
              .catch(() => {
                  // Fallback: If an error occurs, redirect the user to the provided URL
                  window.location.href = url;
              });
      },

  };
