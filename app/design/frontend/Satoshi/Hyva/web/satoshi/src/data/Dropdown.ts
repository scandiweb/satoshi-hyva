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
              // Store the final redirected URL.
              responseUrl = response.url;

              // Ensure the response is successful (HTTP status 200–299).
              if (!response.ok) {
                  throw new Error(`Failed to fetch content. Status: ${response.status}`);
              }

              // Parse the response as HTML text.
              return response.text();
          })
          .then((data) => {
              // Create a temporary container to parse the fetched HTML.
              const resultHtml = document.createElement("div");
              resultHtml.innerHTML = data;

              let newContentHtml = null;

              // Determine the content to replace based on the target selector.
              if (targetSelector === "document") {
                  // If the whole document is being replaced, get the <body> content.
                  newContentHtml = resultHtml.querySelector("body")?.innerHTML;
              } else {
                  // Otherwise, get the content for the specific selector (e.g., '.footer').
                  newContentHtml = resultHtml.querySelector(targetSelector)?.innerHTML;
              }

              // Fallback: If no content is found, use the entire HTML structure.
              if (!newContentHtml) {
                  console.warn("Specified content not found. Falling back to entire HTML structure.");
                  newContentHtml = resultHtml.innerHTML;
              }

              // Get the current element on the page to replace.
              const currentContentElem = document.querySelector(targetSelector === "document" ? "body" : targetSelector);

              // Ensure both the new content and the current element exist before replacing.
              if (newContentHtml && currentContentElem) {
                  // Replace the content while keeping the outer tag (e.g., <body>) intact.
                  currentContentElem.innerHTML = newContentHtml;

                  console.log("Content replaced successfully.");

                  // Optional: Re-run all scripts after replacing the content (disabled for performance reasons).
                  // Array.from(document.querySelectorAll("script")).forEach(oldScript => {
                  //     const newScript = document.createElement("script");
                  //     if (oldScript.src) {
                  //         newScript.src = oldScript.src;  // For external scripts.
                  //     } else {
                  //         newScript.textContent = oldScript.textContent;  // For inline scripts.
                  //     }
                  //     document.body.appendChild(newScript);
                  //     oldScript.remove();
                  // });
              } else {
                  console.error("Could not find the target content element for replacement.");
              }

              // Update the browser's URL without refreshing the page.
              history.replaceState(history.state, "", responseUrl);
          })
          .catch((error) => {
              // Handle any errors that occurred during the fetch or content replacement process.
              console.error("Error fetching and replacing content:", error);

              // Fallback: If an error occurs, redirect the user to the provided URL.
              console.log("Redirecting to:", url);
              window.location.href = url;
          });
    },

  };
