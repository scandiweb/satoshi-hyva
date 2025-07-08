import type { Magics } from "alpinejs";

export type TransitionImageType = {
  [key: string | symbol]: any;

  isImgLoaded: boolean;
  src: string;

  init(): void;
} & Magics<{}>;

type TransitionImageProps = {
  src: string;
  imageId: string;
};

export const TransitionImage = (props: TransitionImageProps) =>
  <TransitionImageType>{
    src: "",
    isImgLoaded: false,

    init() {
      if (!this.src) {
        this.isImgLoaded = true;
      }

      this.src = props.src;

      const { imageId: mainImageId } = props;
      const mainImage = document.getElementById(mainImageId);

      if (!mainImage) {
        return;
      }

      if ((mainImage as HTMLImageElement).complete) {
        this.isImgLoaded = true;
      } else {
        mainImage.addEventListener(
          "load",
          () => {
            this.isImgLoaded = true;
          },
          { once: true },
        );
      }
    },
  };
