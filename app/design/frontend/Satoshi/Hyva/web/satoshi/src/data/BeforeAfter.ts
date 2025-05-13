import type { Magics } from "alpinejs";
import { ARROW_LEFT_KEY, ARROW_RIGHT_KEY } from "../utils/keyboard-keys";

export type BeforeAfterType = {
  wrapperRect?: DOMRect | null;
  wrapperEl?: HTMLElement | null;
  exposure: number;

  init(): void;
  onPointerDown(): void;
  onKeyDown(event: KeyboardEvent): void;
  onInputChange(): void;
} & Magics<{}>;

type BeforeAfterProps = {
  id: string;
};

export const BeforeAfter = (props: BeforeAfterProps) =>
  <BeforeAfterType>{
    wrapperRect: null,
    wrapperEl: null,
    exposure: 50,

    init() {
      const { id } = props;

      this.wrapperEl = document.getElementById(id);

      const computeWrapperRect = () => {
        if (!this.wrapperEl) {
          return;
        }

        const rect = this.wrapperEl.getBoundingClientRect();
        this.wrapperRect = rect;
      };

      window.addEventListener("resize", computeWrapperRect);
      computeWrapperRect();

      this.$watch("exposure", (value: any) => {
        if (!this.wrapperEl) {
          return;
        }

        this.wrapperEl.style.setProperty(
          "--exposure",
          `${100 - parseInt(value, 10)}%`,
        );
      });
    },

    onPointerDown() {
      const move = (e: PointerEvent) => {
        if (!this.wrapperEl || !this.wrapperRect) {
          return;
        }

        // calculate % of X position relative to the wrapper
        const x = e.clientX - this.wrapperRect.left;
        this.exposure = Math.min(
          100,
          Math.max(0, (x / this.wrapperRect.width) * 100),
        );
      };

      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };

      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },

    onKeyDown(e: KeyboardEvent) {
      if (!this.wrapperEl) {
        return;
      }

      if (e.key === ARROW_RIGHT_KEY && this.exposure < 100) {
        this.exposure++;
        e.preventDefault();
      }

      if (e.key === ARROW_LEFT_KEY && this.exposure > 0) {
        this.exposure--;
        e.preventDefault();
      }
    },
  };
