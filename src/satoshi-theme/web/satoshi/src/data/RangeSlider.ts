import type { Magics } from "alpinejs";
import { FILTER_PRICE_PARAM_NAME } from "./Filters";

export type RangeSliderType = {
  isRightThumbActive: boolean;
  isLeftThumbActive: boolean;
  minRange: number;
  maxRange: number;
  currentMinValue: number;
  currentMaxValue: number;
  rangeMinSpace: number;
  priceFilterTimeout: ReturnType<typeof setTimeout> | null;

  init(): void;
  updateThumbPositions(): void;
  applyPriceFilter(): void;
  onThumbDrag(side: 'left' | 'right'): void;
  setActiveRangeValuesFromURL(): void;
} & Magics<{}>;

export const ANIMATION_DURATION = 350;
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
    rangeMinSpace: RANGE_MIN_SPACE,
    priceFilterTimeout: null,

    init() {
      this.setActiveRangeValuesFromURL();
    },

    updateThumbPositions() {
      if (this.currentMinValue < this.minRange) {
        this.currentMinValue = this.minRange;
      } else if (this.currentMinValue > this.currentMaxValue - this.rangeMinSpace) {
        this.currentMinValue = this.currentMaxValue - this.rangeMinSpace;
      }

      if (this.currentMaxValue > this.maxRange) {
        this.currentMaxValue = this.maxRange;
      } else if (this.currentMaxValue < this.currentMinValue + this.rangeMinSpace) {
        this.currentMaxValue = this.currentMinValue + this.rangeMinSpace;
      }

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
      this.selectFilter(FILTER_PRICE_PARAM_NAME, `${this.currentMinValue}-${this.currentMaxValue}`, newUrl, true);
    },

    onThumbDrag(side: 'left' | 'right') {
      const isLeft = side === 'left';
      const isRight = side === 'right';

      const onMouseOrTouchMove = (evt: MouseEvent | TouchEvent) => {
        const sliderRect = (document.querySelector(`.${RANGE_SLIDER_CONTAINER_CLASS}`) as Element).getBoundingClientRect();

        if (!sliderRect) return;

        let x = evt instanceof TouchEvent ? evt.touches[0].clientX : evt.clientX; // Handle both mouse and touch
        const pos = (x - sliderRect.left) / sliderRect.width;
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

      const onMouseOrTouchUp = () => {
        if (isLeft) {
          this.isLeftThumbActive = false;
        } else if (isRight) {
          this.isRightThumbActive = false;
        }
        document.removeEventListener('mousemove', onMouseOrTouchMove);
        document.removeEventListener('mouseup', onMouseOrTouchUp);
        document.removeEventListener('touchmove', onMouseOrTouchMove);
        document.removeEventListener('touchend', onMouseOrTouchUp);
      };

      document.addEventListener('mousemove', onMouseOrTouchMove);
      document.addEventListener('mouseup', onMouseOrTouchUp);
      document.addEventListener('touchmove', onMouseOrTouchMove);
      document.addEventListener('touchend', onMouseOrTouchUp);
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
