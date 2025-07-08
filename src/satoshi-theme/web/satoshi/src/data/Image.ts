const ZOOM_RATIO = 2;
const minScale = 1;
const maxScale = 3;

const getDistance = (touch1: Touch, touch2: Touch) => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

type ImageType = {
  [key: string | symbol]: any;
  previousTouches: TouchList | null;
  scale: number;
  translate: { x: number; y: number };
  resetTimeoutRef: any;
  reset: boolean;

  init(): void;
  zoomImage(event: MouseEvent): void;
  moveWithHover(
    img: HTMLImageElement,
    event: MouseEvent,
    overlay: HTMLElement,
  ): void;
  onTouchStart(event: TouchEvent): void;
  onTouchMove(event: TouchEvent): void;
  onTouchEnd(): void;
  onWheel(event: WheelEvent): void;
  resetAfterDelay(wheel?: boolean): void;
};
export const ImageZoom = () =>
  <ImageType>{
    previousTouches: null,
    scale: 1,
    translate: { x: 0, y: 0 },
    resetTimeoutRef: null,
    reset: false,

    init() {
      // alpine watch scale
      this.$watch("scale", () => {
        Alpine.store("main").opacityOnZoom = Math.max(2 - this.scale, 0);
      });
    },

    zoomImage(e) {
      if (Alpine.store("main").isMobile) {
        return;
      }
      const img = (e.currentTarget as HTMLElement).querySelector(
        "img:not(.transition-image)",
      ) as HTMLImageElement;

      // Create overlay
      const overlayImage = document.createElement("img");
      overlayImage.setAttribute("src", img.src);
      const overlayContainer = document.createElement("div");
      overlayContainer.setAttribute("class", "zoomed-img-container");

      const overlay = document.createElement("div");
      overlay.setAttribute("class", "zoomed-img");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.backgroundImage = `url('${img.src}')`;
      overlayContainer.appendChild(overlay);

      overlayImage.onload = () => {
        img.parentElement!.insertBefore(overlayContainer, img);
      };

      overlay.onclick = (event) => {
        event.stopPropagation();
        overlayContainer.remove();
      };
      overlay.onmousemove = (event) => this.moveWithHover(img, event, overlay);
      overlayContainer.onmouseleave = () => overlayContainer.remove();

      this.moveWithHover(img, e, overlay);
    },

    moveWithHover(img, event, overlay) {
      // calculate mouse position
      const ratio = img.height / img.width;
      const container = (
        event.currentTarget as HTMLElement
      ).getBoundingClientRect();

      const xPosition = event.clientX - container.left;
      const yPosition = event.clientY - container.top;
      const xPercent = `${xPosition / (img.clientWidth / 100)}%`;
      const yPercent = `${yPosition / ((img.clientWidth * ratio) / 100)}%`;

      // determine what to show in the frame
      overlay.style.backgroundPosition = `${xPercent} ${yPercent}`;
      overlay.style.backgroundSize = `${img.width * ZOOM_RATIO}px`;
    },

    onTouchStart(event) {
      if (event.touches.length === 2) {
        event.preventDefault();
        this.previousTouches = event.touches;
      }
    },
    onTouchMove(event) {
      if (event.touches.length === 2 && this.previousTouches) {
        event.preventDefault();
        const newDistance = getDistance(event.touches[0], event.touches[1]);
        const oldDistance = getDistance(
          this.previousTouches[0],
          this.previousTouches[1],
        );

        const scaleChange = newDistance / oldDistance;
        const newScale = Math.min(
          maxScale,
          Math.max(minScale, this.scale * scaleChange),
        );

        const midPoint = {
          x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
          y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
        };

        const previousMidPoint = {
          x:
            (this.previousTouches[0].clientX +
              this.previousTouches[1].clientX) /
            2,
          y:
            (this.previousTouches[0].clientY +
              this.previousTouches[1].clientY) /
            2,
        };

        const movementX = midPoint.x - previousMidPoint.x;
        const movementY = midPoint.y - previousMidPoint.y;

        if (event.currentTarget) {
          const rect = (
            event.currentTarget as HTMLElement
          ).getBoundingClientRect();

          const xCenter = (rect.left + rect.right) / 2;
          const yCenter = (rect.top + rect.bottom) / 2;

          const xDiff = midPoint.x - xCenter;
          const yDiff = midPoint.y - yCenter;

          const scalingTranslateX =
            (this.translate.x - xDiff) * (newScale / this.scale) + xDiff;
          const scalingTranslateY =
            (this.translate.y - yDiff) * (newScale / this.scale) + yDiff;

          this.translate = {
            x: scalingTranslateX + movementX,
            y: scalingTranslateY + movementY,
          };
        }

        this.scale = newScale;
        this.reset = false;
        this.previousTouches = event.touches;
      }
    },
    onTouchEnd() {
      this.previousTouches = null;
      this.resetAfterDelay();
    },
    onWheel(event) {
      if (!event.ctrlKey) {
        return;
      }

      event.preventDefault();
      const scaleChange = 1 - event.deltaY * 0.01;
      const newScale = Math.min(
        maxScale,
        Math.max(minScale, this.scale * scaleChange),
      );

      if (event.currentTarget) {
        const rect = (
          event.currentTarget as HTMLElement
        ).getBoundingClientRect();

        const xCenter = (rect.left + rect.right) / 2;
        const yCenter = (rect.top + rect.bottom) / 2;

        const xDiff = event.clientX - xCenter;
        const yDiff = event.clientY - yCenter;

        const translateX =
          (this.translate.x - xDiff) * (newScale / this.scale) + xDiff;
        const translateY =
          (this.translate.y - yDiff) * (newScale / this.scale) + yDiff;

        this.translate = { x: translateX, y: translateY };
      }

      this.scale = newScale;
      this.reset = false;
      this.resetAfterDelay(true);
    },

    resetAfterDelay(wheel = false) {
      if (this.resetTimeoutRef !== null) {
        clearTimeout(this.resetTimeoutRef);
      }

      this.resetTimeoutRef = window.setTimeout(
        () => {
          this.scale = 1;
          this.translate = { x: 0, y: 0 };
          this.reset = true;
        },
        wheel ? 300 : 0,
      );
    },
  };
