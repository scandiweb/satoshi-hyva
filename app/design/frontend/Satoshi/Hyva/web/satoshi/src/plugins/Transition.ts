import type { Alpine as AlpineType } from "alpinejs";
import { freezeScroll, unfreezeScroll } from "../utils/scroll2";
import { doElementTransitionFromSrcToDest } from "../utils/element-transition";
import { replaceElement } from "../utils/morph";
import nProgress from "nprogress";

nProgress.configure({ showSpinner: false });

let lastMainContentUpdateUrl = window.location.href;
const cachedResponses: Record<string, string> = {};

export const isExternalURL = (url: string) => {
  if (url.startsWith("//")) {
    return new URL(location.protocol + url).origin !== location.origin;
  }

  if (url.includes("://")) {
    return new URL(url).origin !== location.origin;
  }

  return false;
};

export type TransitionStoreType = {
  isTransitioning: boolean;
  pageData: Record<string, any> | undefined;
  pageType: string | undefined;
  isAnimating: Boolean;
  isPreviewAnimating: Boolean;
  originalFocusableEl?: HTMLElement | null;
  _doTransition: (
    areaId: string,
    c1: () => void,
    callback: () => void
  ) => Promise<void>;
  _showTransitionFallback: (isPreview: boolean) => void;
  _clearFallback: () => void;
  __activeTransitionAreaRef: string | null;
  isPreviewActive: boolean;
};

const TransitionStore = <TransitionStoreType>{
  isTransitioning: false,
  pageData: undefined,
  pageType: undefined,
  isAnimating: false,
  isPreviewAnimating: false,
  originalFocusableEl: null,
  __activeTransitionAreaRef: null,
  isPreviewActive: false,

  async _doTransition(areaId, c1, callback) {
    if (
      !Alpine.store("main").isMobile ||
      Alpine.store("main").isReducedMotion
    ) {
      // DO NOT Animate on desktop or if user prefers reduced motion.
      c1();
      callback();
      return;
    }

    const transitionContainerRef = document.querySelector(
      "[x-element-transition-wrapper]",
    ) as HTMLElement;

    if (!transitionContainerRef) {
      console.log("transition container not found");
      return;
    }

    freezeScroll();

    this.__activeTransitionAreaRef = areaId;

    const areaElement = document.querySelector(
      `[x-element-transition-area="${areaId}"]`,
    );

    if (!areaElement) {
      return;
    }

    const srcElements = Object.fromEntries(
      [
        ...(areaElement.querySelectorAll(
          "[x-element-transition-src]",
        ) as NodeListOf<HTMLElement>),
      ].map((srcElement) => [
        srcElement.getAttribute("x-element-transition-src")!,
        srcElement,
      ]),
    );

    if (!srcElements || Object.entries(srcElements).length === 0) {
      return;
    }

    this.isTransitioning = true;

    await new Promise<void>((resolve) => {
      transitionContainerRef.addEventListener(
        "transitionstart",
        () => {
          resolve();
        },
        { once: true },
      );
    });

    const currentPage = window.location.href;

    const animationPromise = Promise.all(
      Object.entries(srcElements).map(([key, srcElem]) =>
        doElementTransitionFromSrcToDest({
          srcElem,
          destElementCallback: () => {
            if (currentPage === window.location.href) {
              // wait until page changes
              return null;
            }

            const destEl = document.querySelector(
              `[x-element-transition-dest="${key}"]`,
            ) as HTMLElement | null;

            if (!destEl) {
              return null;
            }

            return destEl;
          },
          transitionContainer: transitionContainerRef,
          isCopyCssProperties: true,
        }),
      ),
    );

    await new Promise<void>((resolve) => {
      transitionContainerRef.addEventListener(
        "transitionend",
        () => {
          resolve();
        },
        { once: true },
      );
    });

    c1();

    try {
      await animationPromise;
    } catch (e) {
    }
    callback();

    // step 5
    this.isTransitioning = false;

    await new Promise<void>((resolve) => {
      transitionContainerRef.addEventListener(
        "transitionstart",
        () => {
          resolve();
        },
        { once: true },
      );
    });

    await new Promise<void>((resolve) => {
      transitionContainerRef.addEventListener(
        "transitionend",
        () => {
          resolve();
        },
        { once: true },
      );
    });

    // step 6
    while (transitionContainerRef.firstChild) {
      transitionContainerRef.removeChild(transitionContainerRef.firstChild);
    }

    // cleanup
    this.__activeTransitionAreaRef = null;

    unfreezeScroll();
  },

  _showTransitionFallback(isPreview: boolean) {
    const target = isPreview
      ? document.getElementById("PreviewContent")
      : document.getElementById("MainContent");

    const template = document.querySelector(
      `[x-fallback-template-type="${this.pageType!}"]`,
    );

    if (!template) {
      return;
    }

    const content = template.innerHTML;

    if (target) {
      target.innerHTML = content;
    }

    if (!isPreview) {
      window.scrollTo(0, 0);
    }
  },

  _clearFallback() {
    this.pageType = undefined;
    // this.pageData = undefined;
  },
};

const replaceMeta = (rawContent: string) => {
  const regex = /<!-- page-meta -->([\s\S]*?)<!-- end-page-meta -->/;
  const content = rawContent.match(regex);
  const newContent = content ? content[0] : "";

  if (!newContent) {
    return;
  }

  const metaNodes = [];

  // get nodes between comments in document.head.childNodes
  let foundStart = false;
  let foundEnd = false;
  let endComment: Comment | null = null;

  for (let i = 0; i < document.head.childNodes.length; i++) {
    const node = document.head.childNodes[i];

    if (node.nodeType === 8) {
      if (node.nodeValue === " page-meta ") {
        foundStart = true;
        continue;
      }

      if (node.nodeValue === " end-page-meta ") {
        endComment = node as Comment;
        foundEnd = true;
        break;
      }
    }

    if (foundStart && !foundEnd) {
      metaNodes.push(node);
    }
  }

  if (!endComment) {
    return;
  }

  // remove existing meta nodes
  metaNodes.forEach((node) => node.remove());

  // prepare for parsing
  const newMetaContent = newContent
    .replace("<!-- page-meta -->", "<head>")
    .replace("<!-- end-page-meta -->", "</head>");

  // add new meta nodes
  const parser = new DOMParser();
  const newMetaNodes = parser.parseFromString(newMetaContent, "text/html");

  [...newMetaNodes.head.childNodes].forEach((node) => {
    document.head.insertBefore(node, endComment);
  });
};

export const morphContent = (
  rawContent: string,
  lookup: string,
  target: HTMLElement,
) => {
  const regex = new RegExp(
    `<!-- ${lookup} -->([\\s\\S]*?)<!-- end-${lookup} -->`,
    "g",
  );
  const content = rawContent.match(regex);
  const newContent = content ? content[0] : "";
  replaceElement(target, newContent);
};

const reExecuteJs = (target: HTMLElement) => {
  Array.from(target.querySelectorAll("script")).forEach((oldScriptEl) => {
    const newScriptEl = document.createElement("script");

    Array.from(oldScriptEl.attributes).forEach((attr) => {
      newScriptEl.setAttribute(attr.name, attr.value);
    });

    const scriptText = document.createTextNode(oldScriptEl.innerHTML);
    newScriptEl.appendChild(scriptText);

    oldScriptEl.parentNode!.replaceChild(newScriptEl, oldScriptEl);
  });
};

export const replaceContent = (
  rawContent: string,
  lookup: string,
  target: HTMLElement,
) => {
  const regex = new RegExp(
    `<!-- ${lookup} -->([\\s\\S]*?)<!-- end-${lookup} -->`,
    "g",
  );
  const content = rawContent.match(regex);
  const newContent = content ? content[0] : "";
  target.innerHTML = newContent;
  reExecuteJs(target);
  Alpine.nextTick(() => {
    // Reload customerSectionData
    window.dispatchEvent(new CustomEvent("reload-customer-section-data"));
  });
};

export const replaceMainContent = (rawContent: string) => {
  lastMainContentUpdateUrl = window.location.href;
  replaceMeta(rawContent);
  return replaceContent(
    rawContent,
    "main-content",
    document.getElementById("MainContent")!,
  );
};

const replacePreviewContent = (rawContent: string) => {
  replaceMeta(rawContent);
  return replaceContent(
    rawContent,
    "preview-content",
    document.getElementById("PreviewContent")!,
  );
};

const pushStateAndNotify = (...args: Parameters<History["pushState"]>) => {
  args[0] = {
    ...(args[0] || {}),
    backURL: window.location.href,
  };

  history.pushState(...args);

  const pushStateEvent = new CustomEvent("pushstate", {
    detail: {
      state: args[0],
      url: args[2],
    },
  });

  window.dispatchEvent(pushStateEvent);
};

export const fetchPage = (url: string) => {
  // Disable un-fade images (Added here to work with popstate & history.replace)
  enableFadeInImages();

  return fetch(url).then((res) => {
    if (res.ok || res.status === 404) {
      return res.text();
    }

    throw new Error("Failed to get page for transition");
  });
};

export const enableFadeInImages = () => {
  // Disable un-fade images
  document.body.classList.remove("[&_.no-fade]:opacity-100");
  document.body.classList.remove(
    "max-md:[&_.card-product:nth-child(-n+2)_.no-fade]:opacity-100",
  );
  document.body.classList.remove("md:[&_.card-product_.no-fade]:opacity-100");
};

export const cachePage = (url: string, html: string) => {
  cachedResponses[url!] = html;
};

export const fetchAndCachePage = async (url: string) => {
  const html = await fetchPage(url);
  cachePage(url, html);

  return html;
};

export const replaceMainContentWithTransition = async (
  url: string,
  content: string,
) => {
  const scrollPosition = window.scrollY;

  nProgress.start();
  Alpine.store("popup").hideAllPopups();
  Alpine.store("resizable").hideAll();

  history.replaceState({ ...history.state, scrollPosition }, "");
  pushStateAndNotify({}, "", url!);
  cachePage(url, content);
  replaceMainContent(content);
  window.scrollTo(0, 0);

  nProgress.done();
};

export const navigateWithTransition = (
  nextUrl: string,
  options: {
    preview?: boolean;
    animate?: boolean;
    type?: string;
    data?: Record<string, any>;
    areaId?: string;
    target?: HTMLElement | null;
  } = {},
) => {
  Alpine.store("transition").isAnimating = false;
  Alpine.store("transition").isPreviewAnimating = false;

  const currentUrl = window.location.pathname + window.location.search;
  const scrollPosition = window.scrollY;

  if (currentUrl === nextUrl) {
    Alpine.store("popup").hideAllPopups();
    Alpine.store("resizable").hideAll();
    window.scrollTo(0, 0);
    return;
  }

  nProgress.start();

  const isPreview = !!options.preview && !Alpine.store("main").isMobile;

  const isAnimating = !!options.animate;

  const navigate = async () => {
    Alpine.nextTick(async () => {
      const html = await fetchAndCachePage(nextUrl!);

      if (isPreview) {
        replacePreviewContent(html);
      } else {
        // here's the thing.. can we do this only when transition is done??
        replaceMainContent(html);
        window.scrollTo(0, 0);
      }

      Alpine.store("transition")._clearFallback();
      nProgress.done();
    });
  };

  const startNavigating = () => {
    if (options.type && options.data) {
      if (isPreview) {
        Alpine.store("transition").isPreviewAnimating = isAnimating;
        Alpine.store("transition").originalFocusableEl = options.target;
      } else {
        Alpine.store("transition").isAnimating = isAnimating;
      }

      Alpine.store("transition").pageType = options.type;
      Alpine.store("transition").pageData = options.data;
      Alpine.store("transition")._showTransitionFallback(isPreview);
    }

    Alpine.nextTick(async () => {
      Alpine.store("popup").hideAllPopups();
      Alpine.store("resizable").hideAll();
      history.replaceState({ ...history.state, scrollPosition }, "");
      pushStateAndNotify({ isPreview }, "", nextUrl!);
    });
  };

  if (options.areaId) {
    Alpine.store("transition")._doTransition(
      options.areaId!,
      startNavigating,
      navigate
    );
  } else {
    startNavigating();
    navigate();
  }
};

const prefetchedLinks = new Set();

const NON_PREFETCHABLE_PATTERNS = [
  /^\/customer\//,
];

export const shouldPrefetchLink = (link: string): boolean => {
  const path = new URL(link, window.location.origin).pathname;
  return !NON_PREFETCHABLE_PATTERNS.some(pattern => pattern.test(path));
};

export const prefetchLink = (link: string) => {
  if (!shouldPrefetchLink(link)) {
    return;
  }

  const prefetchLink = document.createElement("link");
  prefetchLink.rel = "prefetch";
  prefetchLink.href = link;
  prefetchLink.as = "document";
  document.head.appendChild(prefetchLink);
  prefetchedLinks.add(link);
};

const prefetchObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target as any;
      const href = element.getAttribute("href");
      if (!href || !shouldPrefetchLink(href)) return;
      let timeoutId = element.timeoutId;
      if (entry.isIntersecting && !timeoutId) {
        element.timeoutId = setTimeout(() => {
          if (prefetchedLinks.has(href)) return;
          prefetchLink(href);
          prefetchObserver.unobserve(element);
        }, 200);
      } else if (!entry.isIntersecting && timeoutId) {
        clearTimeout(timeoutId);
        element.timeoutId = null;
      }
    });
  },
  {threshold: 0.1},
);

function TransitionPlugin(Alpine: AlpineType) {
  Alpine.store("transition", TransitionStore);

  Alpine.directive(
    "element-transition-trigger",
    (el, { value, modifiers, expression }, { evaluate, cleanup }) => {
      if (modifiers.includes("desktop") && Alpine.store("main").isMobile) {
        return;
      }

      const transitionAreaEl = el.closest("[x-element-transition-area]");
      const areaId = transitionAreaEl
        ? transitionAreaEl.getAttribute("x-element-transition-area")
        : null;
      const link = el.getAttribute("href");
      const isTargetBlank = el.getAttribute("target") === "_blank";
      const isMobile = Alpine.store("main").isMobile;

      if (!link || isExternalURL(link) || isTargetBlank) {
        return;
      }

      const onHover = () => {
        if (prefetchedLinks.has(link)) return;
        prefetchLink(link);
      };

      const onClick = (e: MouseEvent) => {
        if (window.navigationType === "MPA") {
          // Animate area position card if exists
          const areaElement = document.querySelector(
            `[x-element-transition-area="${areaId}"]`,
          );
          if (!areaElement || !isMobile) {
            return;
          }
          const srcElement = areaElement.querySelector(
            "[x-element-transition-src]",
          );
          const key = srcElement?.getAttribute("x-element-transition-src");
          if (srcElement) {
            sessionStorage.setItem(
              "elementRect",
              JSON.stringify(srcElement.getBoundingClientRect()),
            );
            sessionStorage.setItem(
              "elementHtml",
              srcElement.innerHTML.replace('loading="lazy"', 'loading="eager"'),
            );
            sessionStorage.setItem("destKey", key || "");
          }
        } else {
          e.preventDefault();
          e.stopPropagation();
          navigateWithTransition(link || "", {
            preview: modifiers.includes("preview"),
            animate: modifiers.includes("animate"),
            type: value,
            data: expression ? evaluate(expression) : undefined,
            areaId: areaId || undefined,
            target: e.target as HTMLElement,
          });
        }
      };

      el.addEventListener("click", onClick);
      if (window.navigationType === "MPA") {
        if (isMobile) {
          prefetchObserver.observe(el);
        } else {
          el.addEventListener("mouseover", onHover);
        }
      }

      cleanup(() => {
        el.removeEventListener("click", onClick);
        if (window.navigationType === "MPA") {
          if (isMobile) {
            prefetchObserver.unobserve(el);
          } else {
            el.removeEventListener("mouseover", onHover);
          }
        }
      });
    },
  );

  if (window.navigationType === "MPA") {
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        prefetchedLinks.forEach((link: any) => prefetchLink(link));
      }
    });
  } else {
    let lastPopStateUrl = window.location.href;

    window.addEventListener("popstate", async (event) => {
      Alpine.store("transition").isAnimating = false;
      Alpine.store("transition").isPreviewAnimating = false;

      history.scrollRestoration = "manual";

      if (window.location.href === lastMainContentUpdateUrl) {
        // skip unnecessary fetch
        return;
      }

      const currentPopStateUrl = window.location.href;
      lastPopStateUrl = window.location.href;

      Alpine.store("popup").hideAllPopups();
      Alpine.store("resizable").hideAll();

      nProgress.start();

      const {pathname, search} = new URL(window.location.href);
      const cachedHtml = cachedResponses[pathname + search];

      if (cachedHtml) {
        if (event.state?.isPreview) {
          replacePreviewContent(cachedHtml);
        } else {
          replaceMainContent(cachedHtml);

          if (event.state?.scrollPosition) {
            window.scrollTo({
              top: event.state.scrollPosition,
              behavior: "instant",
            });
          }
        }

        nProgress.done();
        return;
      }

      if (lastPopStateUrl !== currentPopStateUrl) {
        // if there was another popstate, exit early
        return;
      }

      const html = await fetchAndCachePage(
        window.location.pathname + window.location.search,
      );

      if (lastPopStateUrl !== currentPopStateUrl) {
        // if there was another popstate, exit early
        return;
      }

      if (event.state?.isPreview) {
        replacePreviewContent(html);
      } else {
        replaceMainContent(html);

        if (event.state?.scrollPosition) {
          window.scrollTo({
            top: event.state.scrollPosition,
            behavior: "instant",
          });
        }
      }

      nProgress.done();
    });
  }
}

export default TransitionPlugin;
