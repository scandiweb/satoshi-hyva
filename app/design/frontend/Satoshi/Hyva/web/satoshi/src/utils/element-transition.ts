export const doElementTransitionFromSrcToDest = async ({
  srcElem,
  destElementCallback,
  transitionContainer,
  isCopyCssProperties = false,
}: {
  srcElem: HTMLElement;
  destElementCallback: () => HTMLElement | null;
  transitionContainer: HTMLElement;
  isCopyCssProperties?: boolean;
}) => {
  if (!srcElem || !destElementCallback) {
    return;
  }

  const {
    top: st,
    left: sl,
    width: sw,
    height: sh,
  } = srcElem.getBoundingClientRect();

  const clonedElement: HTMLElement = srcElem.cloneNode(true) as HTMLElement;

  if (isCopyCssProperties) {
    const styles = window.getComputedStyle(srcElem);

    [
      "font-family",
      "font-size",
      "font-weight",
      "background",
      "outline",
      "border",
      "color",
    ].forEach((key) => {
      clonedElement.style.setProperty(key, styles.getPropertyValue(key));
    });
  }

  clonedElement.style.top = `${st}px`;
  clonedElement.style.left = `${sl}px`;
  clonedElement.style.width = `${sw}px`;
  clonedElement.style.height = `${sh}px`;
  clonedElement.setAttribute("x-ignore", "");
  transitionContainer.appendChild(clonedElement);

  // wait until condition is met
  await new Promise<void>((resolve, reject) => {
    let maxTries = 100;

    const interval = setInterval(() => {
      if (maxTries <= 0) {
        clearInterval(interval);
        reject();
      }

      const condition = destElementCallback();

      if (condition) {
        clearInterval(interval);
        resolve();
      }

      maxTries -= 1;
    }, 100);
  });

  const destEl = destElementCallback();

  const {
    top: tt,
    left: tl,
    width: tw,
    height: th,
  } = destEl!.getBoundingClientRect();

  clonedElement.style.transform = `translate3d(${tl - sl}px, ${
    tt - st
  }px, 0) scale(${tw / sw}, ${th / sh})`;

  clonedElement.style.borderRadius = window.getComputedStyle(
    destEl!,
  ).borderRadius;

  await new Promise<void>((resolve) => {
    clonedElement.addEventListener(
      "transitionend",
      () => {
        resolve();
      },
      { once: true },
    );
  });
};
