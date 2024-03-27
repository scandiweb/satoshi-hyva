import { Magics } from "alpinejs";

export type SliderType = {
  [key: string | symbol]: any;

  touchStartX: number;
  touchEndX: number;
  isPrevBtnDisabled: boolean;
  isNextBtnDisabled: boolean;
  step: number;
  scrollWidth: number;
  offsetWidth: number;
  resizeObserver: ResizeObserver | null;

  init(): void;
  destroy(): void;
  updateCachedValues(): void;
  calculateStepSize(): number;
  scroll(value: number): void;
  touchStart(e: any): void;
  touchMove(e: any): void;
  handleButtonStatus(): void;
} & Magics<{}>;

export const Slider = (step: number = 2) =>
  <SliderType>{
    touchStartX: 0,
    touchEndX: 0,
    isPrevBtnDisabled: true,
    isNextBtnDisabled: false,
    step,
    scrollWidth: 0,
    offsetWidth: 0,
    resizeObserver: null,

    init() {
      this.updateCachedValues();
      this.resizeObserver = new ResizeObserver(() => {
        this.updateCachedValues();
        this.handleButtonStatus();
      });
      this.resizeObserver.observe(this.$refs.slider);
    },

    destroy() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
    },

    updateCachedValues() {
      this.scrollWidth = this.$refs.slider.scrollWidth;
      this.offsetWidth = this.$refs.slider.offsetWidth;
    },

    calculateStepSize() {
      return (
        (this.scrollWidth / (this.$refs.slider.children?.length || 1)) *
        this.step
      );
    },

    scroll(value) {
      const maxScroll = this.scrollWidth - this.offsetWidth;
      const nextScroll =
        this.$refs.slider.scrollLeft + value * this.calculateStepSize();

      if (nextScroll < 0) {
        this.$refs.slider.scrollLeft = 0;

        return;
      }

      if (nextScroll > maxScroll) {
        this.$refs.slider.scrollLeft = maxScroll;

        return;
      }

      this.$refs.slider.scrollLeft = nextScroll;
    },

    touchStart(e) {
      this.touchStartX = e.changedTouches[0].screenX;
    },

    touchMove(e) {
      this.touchEndX = e.changedTouches[0].screenX;

      if (this.touchStartX - this.touchEndX > 75) {
        this.scroll(1);

        return;
      }

      if (this.touchStartX - this.touchEndX < -75) {
        this.scroll(-1);
      }
    },

    handleButtonStatus() {
      const maxScroll = this.scrollWidth - this.offsetWidth;

      this.isNextBtnDisabled = this.$refs.slider.scrollLeft >= maxScroll;
      this.isPrevBtnDisabled = this.$refs.slider.scrollLeft <= 0;
    },
  };
