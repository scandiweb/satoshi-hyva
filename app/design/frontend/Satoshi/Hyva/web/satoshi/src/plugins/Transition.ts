import type { Alpine as AlpineType } from "alpinejs";
import { freezeScroll, unfreezeScroll } from "../utils/scroll2";
import { doElementTransitionFromSrcToDest } from "../utils/element-transition";
import { replacePage } from "../utils/morph";
import nProgress from "nprogress";

export type TransitionStoreType = {
  isTransitioning: boolean;
  pageData: Record<string, any> | undefined;
  pageType: string | undefined;
  isAnimating: Boolean;
  _registerSrcElement: (
    id: string,
    areaId: string,
    element: HTMLElement
  ) => void;
  _unregisterSrcElement: (id: string, areaId: string) => void;
  _registerDestElement: (id: string, element: HTMLElement) => void;
  _unregisterDestElement: (id: string) => void;
  _registerTemplateElement: (type: string, element: HTMLElement) => void;
  _unregisterTemplateElement: (type: string) => void;
  _doTransition: (areaId: string, callback: () => void) => Promise<void>;
  _showTransitionFallback: () => void;
  _clearFallback: () => void;
  __activeTransitionAreaRef: string | null;
  __transitionAreaSrcElementsRef: Record<string, Record<string, HTMLElement>>;
  __transitionDestElementsRef: Record<string, HTMLElement>;
  __transitionTemplateElementsRef: Record<string, HTMLElement>;
};

const TransitionStore = <TransitionStoreType>{
  isTransitioning: false,
  pageData: undefined,
  pageType: undefined,
  isAnimating: false,
  __activeTransitionAreaRef: null,
  __transitionAreaSrcElementsRef: {},
  __transitionDestElementsRef: {},
  __transitionTemplateElementsRef: {},

  _registerSrcElement(id, areaId, element) {
    if (!this.__transitionAreaSrcElementsRef[areaId]) {
      this.__transitionAreaSrcElementsRef[areaId] = {};
    }

    this.__transitionAreaSrcElementsRef[areaId][id] = element;
  },

  _unregisterSrcElement(id, areaId) {
    if (!this.__transitionAreaSrcElementsRef[areaId]) {
      return;
    }

    if (this.__activeTransitionAreaRef === areaId) {
      return;
    }

    delete this.__transitionAreaSrcElementsRef[areaId][id];

    if (Object.keys(this.__transitionAreaSrcElementsRef[areaId]).length === 0) {
      delete this.__transitionAreaSrcElementsRef[areaId];
    }
  },

  _registerDestElement(id, element) {
    this.__transitionDestElementsRef[id] = element;
  },

  _unregisterDestElement(id) {
    delete this.__transitionDestElementsRef[id];
  },

  _registerTemplateElement(type, element) {
    this.__transitionTemplateElementsRef[type] = element;
  },

  _unregisterTemplateElement(type) {
    delete this.__transitionTemplateElementsRef[type];
  },

  async _doTransition(areaId, callback) {
    const transitionContainerRef = document.querySelector(
      "[x-element-transition-wrapper]"
    ) as HTMLElement;

    if (!transitionContainerRef) {
      console.log("transition container not found");
      return;
    }

    freezeScroll();

    this.__activeTransitionAreaRef = areaId;

    const srcElements = this.__transitionAreaSrcElementsRef[areaId];

    if (!srcElements) {
      return;
    }

    this.isTransitioning = true;

    await new Promise<void>((resolve) => {
      transitionContainerRef.addEventListener(
        "transitionstart",
        () => {
          resolve();
        },
        { once: true }
      );
    });

    const animationPromise = Promise.all(
      Object.entries(srcElements).map(([key, srcElem]) =>
        doElementTransitionFromSrcToDest({
          srcElem,
          destElementCallback: () => {
            const destEl = this.__transitionDestElementsRef[key];
            const destTargetEl = destEl?.querySelector(key);

            if (
              !destEl ||
              !destTargetEl ||
              (destTargetEl instanceof HTMLImageElement &&
                !destTargetEl.complete)
            ) {
              return null;
            }

            return this.__transitionDestElementsRef[key];
          },
          transitionContainer: transitionContainerRef,
          isCopyCssProperties: true,
        })
      )
    );

    await new Promise<void>((resolve) => {
      transitionContainerRef.addEventListener(
        "transitionend",
        () => {
          resolve();
        },
        { once: true }
      );
    });

    callback();

    await animationPromise;

    // step 5
    this.isTransitioning = false;

    await new Promise<void>((resolve) => {
      transitionContainerRef.addEventListener(
        "transitionstart",
        () => {
          resolve();
        },
        { once: true }
      );
    });

    await new Promise<void>((resolve) => {
      transitionContainerRef.addEventListener(
        "transitionend",
        () => {
          resolve();
        },
        { once: true }
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

  _showTransitionFallback() {
    const template = this.__transitionTemplateElementsRef[this.pageType!];
    const content = template.innerHTML;
    const el = document.getElementById("MainContent");

    if (el) {
      el.innerHTML = content;
    }
  },

  _clearFallback() {
    this.pageType = undefined;
    this.pageData = undefined;
  },
};

const replaceMainContent = (rawContent: string) => {
  const regex = /<!-- main-content -->([\s\S]*?)<!-- end-main-content -->/g;
  const el = document.getElementById("MainContent");
  const content = rawContent.match(regex);
  const newContent = content ? content[0] : "";

  replacePage(el, newContent);
};

const fetchPage = (url: string) => {
  return fetch(url).then((res) => {
    if (res.ok) {
      return res.text();
    }

    throw new Error("Failed to get page for transition");
  });
};

function TransitionPlugin(Alpine: AlpineType) {
  Alpine.store("transition", TransitionStore);

  Alpine.directive(
    "element-transition-trigger",
    (el, { value, modifiers, expression }, { evaluate, cleanup }) => {
      const transitionAreaEl = el.closest("[x-element-transition-area]");
      const areaId = transitionAreaEl
        ? transitionAreaEl.getAttribute("x-element-transition-area")
        : null;

      const onClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        Alpine.store("transition").isAnimating = false;
        nProgress.configure({ showSpinner: false });
        nProgress.start();

        const currentUrl = window.location.pathname + window.location.search;
        const nextUrl = el.getAttribute("href");

        if (currentUrl === nextUrl) {
          Alpine.store("popup").hideAllPopups();
          Alpine.store("resizable").hideAll();
          window.scrollTo(0, 0);
          return;
        }

        const navigate = async () => {
          if (value && expression) {
            Alpine.store("transition").isAnimating =
              modifiers.includes("animate");
            Alpine.store("transition").pageType = value;
            Alpine.store("transition").pageData = evaluate(expression);
            Alpine.store("transition")._showTransitionFallback();
          }

          Alpine.nextTick(async () => {
            Alpine.store("popup").hideAllPopups();
            Alpine.store("resizable").hideAll();
            history.pushState({}, "", nextUrl!);
            const nextPage = fetchPage(nextUrl!);
            const html = await nextPage;
            replaceMainContent(html);
            window.scrollTo(0, 0);
            Alpine.store("transition")._clearFallback();
            nProgress.done();
          });
        };

        if (areaId) {
          Alpine.store("transition")._doTransition(areaId!, navigate);
        } else {
          navigate();
        }
      };

      el.addEventListener("click", onClick);

      cleanup(() => {
        el.removeEventListener("click", onClick);
      });
    }
  );

  window.addEventListener("popstate", async ({ state }) => {
    const { productHandle, fallBackData } = state || {};

    if (
      Alpine.store("popupProductDetails")._currentProductHandle &&
      productHandle
    ) {
      Alpine.store("popupProductDetails").show(
        productHandle,
        fallBackData,
        true
      );

      // vvv It's just popup state so lets not fetch any pages again.
      return;
    }

    // An edge case for product popup that need to go 1 more step back to prevent blank step back
    if (
      !Alpine.store("popupProductDetails")._currentProductHandle &&
      Alpine.store("popupProductDetails")._initialLoadedPopupLevel === 1
    ) {
      Alpine.store("popupProductDetails")._initialLoadedPopupLevel = 0;
      history.go(-1);

      return;
    }

    if (
      productHandle &&
      !Alpine.store("popupProductDetails")._currentProductHandle
    ) {
      history.replaceState({}, "", `/products/${productHandle}`);
    }

    const html = await fetchPage(
      window.location.pathname + window.location.search
    );

    replaceMainContent(html);
    Alpine.store("popup").hideAllPopups();
    Alpine.store("resizable").hideAll();
    Alpine.store("popupProductDetails").hide();
  });

  Alpine.directive(
    "element-transition-src",
    (el, { expression: transitionElementId }, { cleanup }) => {
      const transitionAreaEl = el.closest("[x-element-transition-area]");

      if (!transitionAreaEl) {
        return;
      }

      const areaId = transitionAreaEl!.getAttribute(
        "x-element-transition-area"
      );

      Alpine.store("transition")._registerSrcElement(
        transitionElementId,
        areaId!,
        el
      );

      cleanup(() => {
        Alpine.store("transition")._unregisterSrcElement(
          transitionElementId,
          areaId!
        );
      });
    }
  );

  Alpine.directive(
    "element-transition-dest",
    (el, { expression: transitionElementId }, { cleanup }) => {
      Alpine.store("transition")._registerDestElement(transitionElementId, el);

      cleanup(() => {
        Alpine.store("transition")._unregisterDestElement(transitionElementId);
      });
    }
  );

  Alpine.directive(
    "fallback-template-type",
    (el, { expression: pageType }, { cleanup }) => {
      Alpine.store("transition")._registerTemplateElement(pageType, el);

      cleanup(() => {
        Alpine.store("transition")._unregisterTemplateElement(pageType);
      });
    }
  );
}

export default TransitionPlugin;
