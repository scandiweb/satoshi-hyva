import { Magics } from "alpinejs";
import { SELECTOR_LIST } from "../plugins/Accessibility.ts";

export type RatingType = {
  reviewsSection: HTMLElement | null;

  init(): void;
  scrollToRatings(): void;
} & Magics<{}>;

export const Rating = () =>
  <RatingType>{
    reviewsSection: null,

    init() {
      this.reviewsSection =
        document.getElementById("review_form");
    },

    scrollToRatings() {
      let scrollTimeout: any = null;

      if (!this.reviewsSection) {
        return;
      }

      addEventListener(
        "scroll",
        () => {
          clearTimeout(scrollTimeout);

          scrollTimeout = setTimeout(() => {
            if (this.reviewsSection) {
              const firstFocusableEl = this.reviewsSection.querySelector(SELECTOR_LIST) as HTMLInputElement;
              if (firstFocusableEl) {
                firstFocusableEl.focus();
              }
            }
          }, 200);
        },
        { once: true },
      );

      this.reviewsSection.scrollIntoView({ behavior: "smooth" });
    },
  };
