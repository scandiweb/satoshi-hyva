import type { Magics } from "alpinejs";
import { FILTER_PRICE, FILTER_PRICE_PARAM_NAME } from "./Filters";

export type RangeSliderType = {
  isRightThumbActive: boolean;
  isLeftThumbActive: boolean;
  minRange: number;
  maxRange: number;
  currentMinValue: number;
  currentMaxValue: number;
  rangeMinSpace: number;
  sliderRect: DOMRect | null;
  priceFilterTimeout: ReturnType<typeof setTimeout> | null;

  init(): void;
  updateThumbPositions(): void;
  applyPriceFilter(): void;
  onThumbDrag(side: 'left' | 'right'): void;
  setActiveRangeValuesFromURL(): void;
} & Magics<{}>;

export const ANIMATION_DURATION = 300;
export const RANGE_MIN_SPACE = 5;
export const RANGE_SLIDER_CONTAINER_CLASS = "range-slider-container";

export const RangeSlider = (
  minRange: number | unknown,
  maxRange: number | unknown
) =>
  <RangeSliderType>{
    isRightThumbActive: false,
    isLeftThumbActive: false,
    minRange: Number(minRange) || 0,
    maxRange: Number(maxRange),
    currentMinValue: Number(minRange) || 0,
    currentMaxValue: Number(maxRange),
    sliderRect: null,
    rangeMinSpace: RANGE_MIN_SPACE,
    priceFilterTimeout: null,

    init() {
      this.sliderRect = (document.querySelector(`.${RANGE_SLIDER_CONTAINER_CLASS}`) as Element).getBoundingClientRect();
      this.setActiveRangeValuesFromURL();
    },

    updateThumbPositions() {
      this.currentMinValue = Math.min(this.currentMinValue, this.currentMaxValue - this.rangeMinSpace);
      this.currentMaxValue = Math.max(this.currentMaxValue, this.currentMinValue + this.rangeMinSpace);

      // Debounce ApplyFilter to prevent it from being called too frequently
      if (this.priceFilterTimeout) {
        clearTimeout(this.priceFilterTimeout);
      }

      this.priceFilterTimeout = setTimeout(() => {
        this.applyPriceFilter();
      }, ANIMATION_DURATION);
    },

    applyPriceFilter() {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set(FILTER_PRICE_PARAM_NAME, `${this.currentMinValue}-${this.currentMaxValue}`);
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

      // @ts-ignore
      this.selectFilter(FILTER_PRICE, newUrl);
    },

    onThumbDrag(side: 'left' | 'right') {
      const isLeft = side === 'left';
      const isRight = side === 'right';

      const onMouseMove = (evt: MouseEvent | TouchEvent) => {
        if (!this.sliderRect) return;

        let x = evt instanceof TouchEvent ? evt.touches[0].clientX : evt.clientX; // Handle both mouse and touch
        const pos = (x - this.sliderRect.left) / this.sliderRect.width;
        const newValue = Math.round(pos * (this.maxRange - this.minRange) + this.minRange);

        if (isLeft) {
          this.isLeftThumbActive = true;
          this.currentMinValue = Math.min(Math.max(newValue, this.minRange), this.currentMaxValue - this.rangeMinSpace);
        } else if (isRight) {
          this.isRightThumbActive = true;
          this.currentMaxValue = Math.max(Math.min(newValue, this.maxRange), this.currentMinValue + this.rangeMinSpace);
        }

        this.updateThumbPositions();
      };

      const onMouseUp = () => {
        if (isLeft) {
          this.isLeftThumbActive = false;
        } else if (isRight) {
          this.isRightThumbActive = false;
        }
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },

    setActiveRangeValuesFromURL() {
      const urlPriceRange = new URLSearchParams(window.location.search).get(FILTER_PRICE_PARAM_NAME);
      if (urlPriceRange) {
        const [urlMin, urlMax] = urlPriceRange.split("-").map(Number);

        if (!isNaN(urlMin)) this.currentMinValue = urlMin;
        if (!isNaN(urlMax)) this.currentMaxValue = urlMax;
      }
    },
  };
