import type { Alpine as AlpineType } from "alpinejs";

type ElementWithXAttributes<T extends HTMLElement> = T & {
  _x_teleport?: ElementWithXAttributes<HTMLElement>;
  _x_teleportTarget?: HTMLElement;
  _x_teleportBack?: ElementWithXAttributes<HTMLTemplateElement>;
  _x_forwardEvents?: string[];
  _x_ignore?: true | undefined;
};

export default function (Alpine: AlpineType) {
  const placeInDom = (clone: HTMLElement, target: HTMLElement | null) => {
    target?.appendChild(clone);
  };

  const getAllClones = () => {
    return Array.from(
      document.querySelectorAll("[data-from-portal]"),
    ) as ElementWithXAttributes<HTMLElement>[];
  };

  const getAllTemplates = () => {
    return Array.from(
      document.querySelectorAll("[data-portal]"),
    ) as ElementWithXAttributes<HTMLTemplateElement>[];
  };

  const getCurrentCloneFromTemplate = (template: HTMLElement) => {
    return getAllClones().find((clone) => clone._x_teleportBack === template);
  };

  const getTarget = (template: ElementWithXAttributes<HTMLTemplateElement>) => {
    const expression = template.getAttribute("x-portal") || "";
    let rawTarget = Alpine.evaluate(template, expression);

    if (!rawTarget) {
      throw "No element provided to x-portal...";
    }

    // check if is HTML element
    if (!(rawTarget instanceof HTMLElement)) {
      console.warn(`Cannot find x-portal target for selector: "${expression}"`);
    }

    return rawTarget as HTMLElement;
  };

  const initClone = (
    clone: ElementWithXAttributes<HTMLElement>,
    targetEl: HTMLElement,
    templateEl: ElementWithXAttributes<HTMLTemplateElement>,
  ) => {
    try {
      // Add reference to element on <template x-teleport, and visa versa.
      templateEl._x_teleport = clone;
      clone._x_teleportBack = templateEl;
      clone._x_teleportTarget = targetEl;

      clone.setAttribute("data-from-portal", "true");
      templateEl.setAttribute("data-portal", "true");

      // Forward event listeners:
      if (templateEl._x_forwardEvents) {
        templateEl._x_forwardEvents.forEach((eventName) => {
          clone.addEventListener(eventName, (e) => {
            e.stopPropagation();

            // @ts-ignore
            templateEl.dispatchEvent(new e.constructor(e.type, e));
          });
        });
      }

      Alpine.addScopeToNode(clone, {}, templateEl);

      Alpine.mutateDom(() => {
        placeInDom(clone, targetEl);

        Alpine.initTree(clone);

        clone._x_ignore = true;
      });
    } catch (e) {
      console.log("Failed to init clone for", templateEl);
      console.trace();
    }
  };

  const createPortal = (
    templateEl: ElementWithXAttributes<HTMLTemplateElement>,
  ) => {
    const targetEl = getTarget(templateEl);

    const oldClone = getCurrentCloneFromTemplate(templateEl);

    if (oldClone) {
      teleportClone(templateEl, oldClone);
      return;
    }

    const clone = (templateEl.content.cloneNode(true) as Element)
      .firstElementChild as ElementWithXAttributes<HTMLElement>;

    initClone(clone, targetEl, templateEl);
  };

  function cloneWithCleanup(originalElement: HTMLElement): HTMLElement {
    // Function to copy properties starting with "_x_"
    const doCleanup = (source: HTMLElement) => {
      const cSource = source as Record<string, any>;

      if (cSource._x_currentIfEl) {
        // support x-if (cleanup the copied element)
        cSource._x_currentIfEl.remove();
      }

      if (cSource._x_lookup) {
        // support x-for (cleanup the copied elements)
        Object.values(cSource._x_lookup).forEach((element: any) => {
          (element as HTMLElement).remove();
        });
      }
    };

    const recursivelyCloneChildren = (originalParent: HTMLElement) => {
      const originalChildren = originalParent.children;

      for (let i = 0; i < originalChildren.length; i++) {
        doCleanup(originalChildren[i] as HTMLElement);
        recursivelyCloneChildren(originalChildren[i] as HTMLElement);
      }
    };

    // Start the recursive cloning for child elements
    recursivelyCloneChildren(originalElement);

    // Clone the element deeply
    return originalElement.cloneNode(true) as HTMLElement;
  }

  const teleportClone = (
    templateEl: ElementWithXAttributes<HTMLTemplateElement>,
    oldClone: ElementWithXAttributes<HTMLElement>,
  ) => {
    // make a copy of the old clone
    const newClone = cloneWithCleanup(oldClone);

    // simply copy the old node to a new place
    const targetEl = getTarget(templateEl);

    initClone(newClone, targetEl, templateEl);
  };

  const observer = new MutationObserver(() => {
    getAllClones().forEach((clone) => {
      const templateEl = clone._x_teleportBack;

      if (templateEl) {
        const newTeleportTarget = Alpine.evaluate(
          templateEl,
          templateEl.getAttribute("x-portal") || "",
        );

        if (!document.body.contains(templateEl)) {
          // remove clone, if template is not in the DOM
          // console.log("clone removed, TEMPLATE not in the DOM", clone);
          clone.remove();
          return;
        }

        if (newTeleportTarget !== clone._x_teleportTarget) {
          // remove clone, if it's not in the right place
          // console.log("clone removed, incorrect location", clone);
          clone.remove();
          return;
        }
      } else {
        // remove no teleport target
        // console.log("clone removed, no teleport target", clone);
        clone.remove();
        return;
      }

      if (!document.body.contains(clone)) {
        // remove clone, if it's not in the DOM
        // console.log("clone removed, CLONE not in the DOM", clone);
        clone.remove();
      }
    });

    getAllTemplates().forEach((templateEl) => {
      const targetEl = templateEl._x_teleport;

      if (!targetEl) {
        return;
      }

      if (!document.body.contains(targetEl)) {
        // for some reason, sometimes, x-portal directive is not executed...
        // we need to call it manually
        createPortal(templateEl);
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  Alpine.directive("portal", (rawEl, {}, { cleanup, effect }) => {
    if (rawEl.tagName.toLowerCase() !== "template")
      console.warn("x-portal can only be used on a <template> tag", rawEl);

    const templateEl = rawEl as ElementWithXAttributes<HTMLTemplateElement>;

    createPortal(templateEl);

    effect(() => {
      const newTargetEl = getTarget(templateEl);
      const currentClone = getCurrentCloneFromTemplate(templateEl);
      const currentTarget = currentClone?._x_teleportTarget;

      if (newTargetEl !== currentTarget) {
        // re-create a portal
        createPortal(templateEl);
      }
    });

    cleanup(() => {
      const clone = getCurrentCloneFromTemplate(templateEl);

      if (clone) {
        clone.remove();
      }
    });
  });
}
