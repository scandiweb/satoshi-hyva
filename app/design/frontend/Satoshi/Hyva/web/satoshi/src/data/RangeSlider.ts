import type {Magics} from "alpinejs";
import {FILTER_PRICE, FILTER_PRICE_MIN, FILTER_PRICE_MAX} from "./Filters";

export type RangeSliderType = {
    [key: string | symbol]: any;

    isLeftThumbActive: boolean;
    isRightThumbActive: boolean;
    isResetting: boolean;
    min: number;
    max: number;
    minValue: number;
    maxValue: number;

    onMinValueInput(): void;
    onMaxValueInput(): void;
    onValueChange(): void;
    onTrackClick(event: MouseEvent): void;
    resetValues(): void;
} & Magics<{}>;

export const ANIMATION_DURATION = 300;

export const RangeSlider = (
    min: number | unknown,
    max: number | unknown,
    minValue: number | unknown,
    maxValue: number | unknown,
) =>
    <RangeSliderType>{
        isLeftThumbActive: false,
        isRightThumbActive: false,
        isResetting: false,
        min: Number(min),
        max: Number(max),
        minValue: Number(minValue),
        maxValue: Number(maxValue),

        init() {
            this.setPrice(this.minValue, this.maxValue);
        },

        onMinValueInput() {
            this.isLeftThumbActive = true;
            this.minValue = Math.min(this.minValue, this.maxValue - 1);
        },

        onMaxValueInput() {
            this.isRightThumbActive = true;
            this.maxValue = Math.max(this.maxValue, this.minValue + 1);
        },

        onValueChange() {
            this.isLeftThumbActive = false;
            this.isRightThumbActive = false;
            this.applyPrice(this.minValue, this.maxValue);
        },

        onTrackClick(event: MouseEvent) {
            const trackPosition = (event.target as Element).getBoundingClientRect();
            const clickPosition = event.pageX - trackPosition.left;
            const midpoint = this.minValue + (this.maxValue - this.minValue) / 2;
            const pxByUnit =
                (trackPosition.right - trackPosition.left) / (this.max - this.min);
            const clickedValue = Math.round(clickPosition / pxByUnit);

            this.isResetting = true;

            if (clickedValue > midpoint) {
                this.maxValue = clickedValue;
            } else {
                this.minValue = clickedValue;
            }

            setTimeout(() => {
                this.isResetting = false;
                this.onValueChange();
            }, ANIMATION_DURATION);
        },

        resetValues() {
            if (
                !this.$event.detail.name ||
                this.$event.detail.name === FILTER_PRICE ||
                this.$event.detail.name === FILTER_PRICE_MIN
            ) {
                this.isResetting = true;
                this.minValue = this.min;
            }

            if (
                !this.$event.detail.name ||
                this.$event.detail.name === FILTER_PRICE ||
                this.$event.detail.name === FILTER_PRICE_MAX
            ) {
                this.isResetting = true;
                this.maxValue = this.max;
            }

            setTimeout(() => {
                this.isResetting = false;
            }, ANIMATION_DURATION);
        },
    };
