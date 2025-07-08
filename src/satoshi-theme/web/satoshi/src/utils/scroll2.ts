import { ARROW_DOWN_KEY, ARROW_UP_KEY } from "./keyboard-keys";
import { isMobile } from "./device";

let globalTargetElement: HTMLElement | null = null;

export let isDocumentFreezed = false;

function onDocumentTouchMove(e: Event) {
  // Allow default functionality of range slider
  if (e.target instanceof HTMLInputElement && e.target.type === "range") {
    return;
  }

  e.preventDefault();
}

function onElementTouchMove(e: Event) {
  e.stopPropagation();
  e.stopImmediatePropagation();
}

function onDocumentArrowKeys(e: KeyboardEvent) {
  if (e.key === ARROW_DOWN_KEY || e.key === ARROW_UP_KEY) {
    e.preventDefault();
  }
}

function onElementArrowKeys(e: KeyboardEvent) {
  if (e.key === ARROW_DOWN_KEY || e.key === ARROW_UP_KEY) {
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
}

export const freezeScroll = () => {
  if (!isDocumentFreezed) {
    document.addEventListener("touchmove", onDocumentTouchMove, {
      passive: false,
    });

    document.addEventListener("wheel", onDocumentTouchMove, {
      passive: false,
    });

    document.addEventListener("keydown", onDocumentArrowKeys, {
      passive: false,
    });

    document.body.style.overflow = "hidden";

    isDocumentFreezed = true;
  }
};

export const makeElementScrollable = (targetElement?: HTMLElement) => {
  if (targetElement && targetElement !== globalTargetElement) {
    globalTargetElement = targetElement;
    globalTargetElement.addEventListener("keydown", onElementArrowKeys);
    globalTargetElement.addEventListener("touchmove", onElementTouchMove);
    globalTargetElement.addEventListener("wheel", onElementTouchMove);
    globalTargetElement.style.setProperty(
      "-webkit-overflow-scrolling",
      "touch",
    );
  }
};

export const makeElementNotScrollable = () => {
  if (globalTargetElement) {
    globalTargetElement.removeEventListener("keydown", onElementArrowKeys);
    globalTargetElement.removeEventListener("touchmove", onElementTouchMove);
    globalTargetElement.removeEventListener("wheel", onElementTouchMove);
    globalTargetElement.style.removeProperty("-webkit-overflow-scrolling");
    globalTargetElement = null;
  }
};

export const unfreezeScroll = () => {
  if (isDocumentFreezed) {
    document.removeEventListener("keydown", onDocumentArrowKeys);
    document.removeEventListener("touchmove", onDocumentTouchMove);
    document.removeEventListener("wheel", onDocumentTouchMove);
    isDocumentFreezed = false;
    document.body.style.overflow = "";
  }

  makeElementNotScrollable();
};

export const proxyScroll = (): void => {
  // Proxy properties to a container
  // window.scrollTo => document.getElementById('root').scrollTo
  // window.scrollY => document.getElementById('root').scrollTop
  // window.scroll => document.getElementById('root').scroll

  if (isMobile()) {
    return;
  }

  const rootElement = document.getElementById("root");

  if (!rootElement) {
    // eslint-disable-next-line no-console
    console.warn("Element with id 'root' not found.");
    return;
  }

  // make it scrollable
  rootElement.style.position = "fixed";
  rootElement.style.top = "0";
  rootElement.style.left = "0";
  rootElement.style.right = "0";
  rootElement.style.bottom = "0";
  rootElement.style.overflow = "auto";

  // Override window.scrollTo
  window.scrollTo = (...args: [ScrollToOptions?] | [number, number]) => {
    if (typeof args[0] === "object") {
      rootElement.scrollTo(args[0]);
      return;
    }

    rootElement.scrollTo(args[0]!, args[1]!);
  };

  // Override window.scrollY
  Object.defineProperty(window, "scrollY", {
    get: () => rootElement.scrollTop,
  });

  // Override window.scroll
  window.scroll = window.scrollTo;
};
