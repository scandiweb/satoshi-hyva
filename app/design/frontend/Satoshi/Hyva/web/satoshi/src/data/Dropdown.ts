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
    navigateAndReplaceContent(url: string, targetSelector: string, options: object): void;
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

    navigateAndReplaceContent(url: string, targetSelector: string = "document", options: object = {}) {
      if (!url) return;

      (async () => {
          this.hide();

          try {
            await navigateWithTransition(url, options);

            // Fetch the new content, following any redirects automatically
            const response = await fetch(url, { redirect: "follow" });

            if (!response.ok) {
              throw new Error("Network response was not ok");
            }

            const responseUrl = response.url;
            const data = await response.text();

            // Create a temporary container to hold the fetched HTML
            const resultHtml = document.createElement("div");
            resultHtml.innerHTML = data;

            let newContentHtml = resultHtml.querySelector(
        targetSelector === "document" ? "body" : targetSelector
            )?.innerHTML;

            // Fallback: If the body or target content is not found, try using the entire fetched HTML structure
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
          } catch (error) {
            window.location.href = url;
          }
      })();
    },
  };
