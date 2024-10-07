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
  const skipEl = clonedElement.querySelector(
    "[x-element-transition-skip]",
  ) as HTMLElement;

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

  clonedElement
    .querySelector('[loading="lazy"]')
    ?.setAttribute("loading", "eager");
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

  if (skipEl) {
    skipEl.style.transform = `scale(${sw / tw}, ${sh / th})`;
    skipEl.style.bottom = `${8 / (th / sh)}px`;

    const styles = skipEl.getAttribute("x-element-transition-skip");
    if (styles) {
      const styleRules = JSON.parse(styles);
      Object.keys(styleRules).forEach((key: any) => {
        skipEl.style[key] = styleRules[key];
      });
    }
  }

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
