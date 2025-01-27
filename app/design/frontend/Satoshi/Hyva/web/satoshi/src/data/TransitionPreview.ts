import type { Magics } from "alpinejs";
import { freezeScroll, makeElementScrollable, unfreezeScroll, } from "../utils/scroll2";
import { isMobile } from "../utils/device";
import { ESC_KEY } from "../utils/keyboard-keys";

export type TransitionPreviewType = {
  [key: string | symbol]: any;
  maxScroll: number;
  offsetTop: number;
  isActive: boolean;
  lastSeenWithoutPreview: number;
  _scrollContainerRef: HTMLElement | null;
  init(): void;
  scrollToPreviewTop(): void;
  scrollToTop(): void;
  hidePreview(): void;
  showPreview(): void;
  _onKeyDown(event: KeyboardEvent): void;
} & Magics<{}>;

const easeInOutQuad = (x: number): number => {
  return x;
};

const OFFSET_TOP = 200;
let prevIsMobile = isMobile();

export const TransitionPreview = () =>
  <TransitionPreviewType>{
    isActive: false,
    lastSeenWithoutPreview: 0,
    offsetTop: OFFSET_TOP,
    maxScroll: (OFFSET_TOP / 4) * 3,
    _scrollContainerRef: null,
    init() {
      // if state.isPreview => showPreview, else hidePreview
      // keep track of lastSeenWithoutPreview (count of pushState since state.isPreview was false)
      // when hidePreview is called, navigate to -lastSeenWithoutPreview
      Alpine.nextTick(() => {
        this._scrollContainerRef = this.$refs.scrollContainer;
      });

      window.addEventListener("pushstate", async (event) => {
        const { state } = (
          event as CustomEvent<{
            state: any;
            url: string | URL | null | undefined;
          }>
        ).detail;

        if (state?.isPreview) {
          this.lastSeenWithoutPreview += 1;
          this.showPreview();
        } else {
          this.lastSeenWithoutPreview = 0;
          this.hidePreview();
        }
      });

      window.addEventListener("popstate", async (event) => {
        const { state } = event;

        if (state?.isPreview) {
          this.lastSeenWithoutPreview -= 1;
          this.showPreview();
        } else {
          this.lastSeenWithoutPreview = 0;
          this.hidePreview();
        }
      });

      // Remove preview flag when page reloads
      window.addEventListener("beforeunload", function () {
        const { isPreview } = window.history.state || {};
        if (isPreview) {
          history.replaceState({ isPreview: false }, "", window.location.href);
        }
      });

      this.$refs.scrollContainer.addEventListener("scroll", () => {
        const percentOfMaxScroll = Math.min(
          this.$refs.scrollContainer.scrollTop / this.maxScroll,
          1,
        );

        this.$refs.preview.style.setProperty(
          "--scroll-progress",
          easeInOutQuad(percentOfMaxScroll).toString(),
        );
      });

      window.addEventListener("resize", () => {
        if (prevIsMobile !== isMobile()) {
          this.hidePreview();
        }
      });
    },

    scrollToPreviewTop() {
      this._scrollContainerRef?.scrollTo({
        top: this.maxScroll,
        behavior: "smooth",
      });
    },

    scrollToTop() {
      this._scrollContainerRef?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },

    showPreview() {
      if (this.isActive) {
        this.scrollToPreviewTop();
        return;
      }

      this.isActive = true;
      Alpine.store("transition").isPreviewActive = true;
      this.scrollToTop();
      freezeScroll();
      makeElementScrollable(this._scrollContainerRef!);

      document.addEventListener("keydown", this._onKeyDown.bind(this));
    },

    hidePreview() {
      if (!this.isActive) return;

      this.scrollToTop();
      this.isActive = false;
      Alpine.store("transition").isPreviewActive = false;

      if (this.lastSeenWithoutPreview) {
        history.go(-this.lastSeenWithoutPreview);
      }

      unfreezeScroll();

      setTimeout(() => {
        const wrapperEl = document.querySelector(".transition-preview");
        if (wrapperEl) {
          wrapperEl.removeAttribute("role");
          wrapperEl.removeAttribute("aria-modal");
          wrapperEl.removeAttribute("aria-labelledby");
        }
        document.getElementById("PreviewContent")!.innerHTML = "";

        // Focus on original element
        Alpine.store("transition").originalFocusableEl?.focus();
        Alpine.store("transition").originalFocusableEl = null;
      }, 300);

      document.removeEventListener("keydown", this._onKeyDown);
    },

    _onKeyDown(e: KeyboardEvent) {
      const isEscPressed = e.key === ESC_KEY;

      if (isEscPressed) {
        const resizables = Alpine.store("resizable")._current;
        if (!Object.keys(resizables).length) {
          this.hidePreview();
        }
      }
    },
  };
