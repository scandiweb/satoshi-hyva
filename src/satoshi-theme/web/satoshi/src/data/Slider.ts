import { Magics } from "alpinejs";
import { SELECTOR_LIST } from "../plugins/Accessibility";

type SlidesAmountInViewType = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
};

type SliderConfig = {
  slidesAmountInView: SlidesAmountInViewType;
  gap: number;
  isAutoplay: boolean;
  autoplaySpeed?: number;
};

export type SliderType = {
  [key: string | symbol]: any;

  isPrevBtnDisabled: boolean;
  isNextBtnDisabled: boolean;
  config: SliderConfig;
  currentSlideIndex: number;
  resizeObserver: ResizeObserver | null;
  slideWidth: number | null;
  autoplayInterval: number | null;

  configureAndStart(config: SliderConfig): void;
  play(): void;
  start(): void;
  debouncedHandleManualScroll: () => void;
  debounce: (func: Function, wait: number) => (...args: any[]) => void;
  init(): void;
  destroy(): void;
  updateCachedValues(): void;
  goToSlide(index: number, focus?: boolean): void;
  showNextSlide(): void;
  showPrevSlide(): void;
  touchStart(e: any): void;
  touchMove(e: any): void;
  handleManualScroll(): void;
  getSlidesAmountInView(): number;
} & Magics<{}>;

export const Slider = () =>
  <SliderType>{
    isPrevBtnDisabled: true,
    isNextBtnDisabled: false,
    currentSlideIndex: 1,
    resizeObserver: null,
    slideWidth: null,
    config: {},
    autoplayInterval: null,

    debouncedHandleManualScroll: () => {},

    configureAndStart(config) {
      this.config = config;
      this.start();
      this.play();
    },

    play() {
      const { isAutoplay, autoplaySpeed = 5000 } = this.config;
      if (!isAutoplay) {
        return;
      }

      if (this.autoplayInterval) {
        window.clearInterval(this.autoplayInterval);
      }

      this.autoplayInterval = window.setInterval(() => {
        if (this.currentSlideIndex < this.$refs.slider.childElementCount) {
          this.goToSlide(this.currentSlideIndex + 1);
        } else {
          this.goToSlide(1);
        }
      }, autoplaySpeed);
    },

    start() {
      const debouncedResizeHandler = Alpine.debounce(() => {
        this.updateCachedValues();
        this.handleManualScroll();
      }, 100);

      this.updateCachedValues();
      this.resizeObserver = new ResizeObserver(debouncedResizeHandler);
      this.resizeObserver.observe(this.$refs.slider);
      this.debouncedHandleManualScroll = Alpine.debounce(() => {
        this.handleManualScroll();
      }, 100);
      this.debouncedHandleManualScroll();

      const { gap } = this.config;
      const proxScrollTarget =
        (this.currentSlideIndex - 1) * ((this.slideWidth || 1) + gap);

      this.$refs.slider.scrollTo({
        left: proxScrollTarget,
        behavior: "smooth",
      });
    },

    destroy() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
    },

    updateCachedValues() {
      if (!this.$refs.slider) {
        return;
      }

      if (this.$refs.slider.childElementCount) {
        this.slideWidth = (
          this.$refs.slider.children[0] as HTMLElement
        ).offsetWidth;
      }
    },

    goToSlide(index: number, focus: boolean = false) {
      const { gap } = this.config;
      const maxIndex = this.$refs.slider.childElementCount;
      const validIndex = Math.max(1, Math.min(index, maxIndex));
      const proxScrollTarget =
        (validIndex - 1) * ((this.slideWidth || 1) + gap);

      this.$refs.slider.scrollTo({
        left: proxScrollTarget,
        behavior: Alpine.store("main").isReducedMotion ? "instant" : "smooth",
      });

      if (focus) {
        setTimeout(
          () => {
            const slide = this.$refs.slider.children[index - 1].querySelector(
              SELECTOR_LIST,
            ) as HTMLElement;
            slide.focus();
          },
          Alpine.store("main").isReducedMotion ? 0 : 500,
        );
      }

      this.currentSlideIndex = validIndex;
    },

    showNextSlide() {
      const nextIndex =
        this.currentSlideIndex + Math.floor(this.getSlidesAmountInView()) <=
        this.$refs.slider.childElementCount
          ? this.currentSlideIndex + Math.floor(this.getSlidesAmountInView())
          : this.$refs.slider.childElementCount;

      this.goToSlide(nextIndex);
      this.play();
    },

    showPrevSlide() {
      const prevIndex =
        this.currentSlideIndex - Math.floor(this.getSlidesAmountInView()) >= 1
          ? this.currentSlideIndex - Math.floor(this.getSlidesAmountInView())
          : 1;

      this.goToSlide(prevIndex);
      this.play();
    },

    handleManualScroll() {
      if (!this.$refs.slider) {
        return;
      }

      const { gap } = this.config;
      const containerScrollLeft = this.$refs.slider.scrollLeft;
      // vvv Amount of scrolled over + 1
      const currentSlideIndex =
        Math.ceil(containerScrollLeft / ((this.slideWidth || 1) + gap)) + 1;

      this.currentSlideIndex = currentSlideIndex;

      this.isNextBtnDisabled =
        currentSlideIndex >
        Math.ceil(
          this.$refs.slider.childElementCount - this.getSlidesAmountInView(),
        );
      this.isPrevBtnDisabled = currentSlideIndex <= 1;
    },

    getSlidesAmountInView() {
      const {
        slidesAmountInView: { xs, sm, md, lg, xl, xxl },
      } = this.config;
      const viewWidth = Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0,
      );
      const screenSm = 640;
      const screenMd = 768;
      const screenLg = 1024;
      const screenXl = 1280;
      const screen2xl = 1536;

      if (viewWidth >= screen2xl) {
        return xxl;
      }

      if (viewWidth >= screenXl) {
        return xl;
      }

      if (viewWidth >= screenLg) {
        return lg;
      }

      if (viewWidth >= screenMd) {
        return md;
      }

      if (viewWidth >= screenSm) {
        return sm;
      }

      return xs;
    },
  };
