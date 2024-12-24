import {Magics} from "alpinejs";

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
        document.getElementById("review-form");
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
              const firstInputElement = this.reviewsSection?.querySelector("input");
              firstInputElement?.focus();
            }
          }, 50);
        },
        {once: true},
      );

      this.reviewsSection.scrollIntoView({behavior: "smooth"});
    },
  };
