const _handleElementTransition = (from: Node, to: Node) => {
  if (
    !(from instanceof Element) ||
    !from.hasAttribute("x-element-transition-src")
  ) {
    return;
  }

  const id = (to as Element).getAttribute("x-element-transition-src");
  const areaId = (to as Element)
    .closest("[x-element-transition-area]")
    ?.getAttribute("x-element-transition-area");

  if (!id || !areaId) {
    return;
  }

  // Re-register elements so that transitions would work after morphing
  Alpine.store("transition")._registerSrcElement(
    id,
    areaId,
    from as HTMLElement
  );
};

const _handleInputValue = (from: Node, to: Node) => {
  if (
    !(from instanceof HTMLInputElement) ||
    !(to instanceof HTMLInputElement)
  ) {
    return;
  }

  if (
    (from.type === "checkbox" || from.type === "radio") &&
    from.checked !== to.checked
  ) {
    from.checked = to.checked;
  }
};

const _handleTemplates = (from: Node, to: Node) => {
  if (
    !(from instanceof HTMLTemplateElement) ||
    !(to instanceof HTMLTemplateElement)
  ) {
    return;
  }

  const newNodes = Array.from(to.content.children);

  // replace to.content with from.content
  from.content.replaceChildren(...newNodes);
};

export const replaceElement = (
  from: Node | null,
  to: string | Node | null,
  resetInputValues?: boolean
) => {
  if (!from || !to) {
    return;
  }

  Alpine.morph(from, to, {
    updating(
      from: Node,
      _to: Node,
      _childrenOnly: VoidFunction,
      skip: VoidFunction
    ) {
      if (from instanceof Element && from.hasAttribute("x-morph-ignore")) {
        return skip();
      }
    },
    updated(from, to) {
      _handleElementTransition(from, to);
      _handleTemplates(from, to);

      if (resetInputValues) {
        _handleInputValue(from, to);
      }
    },
  });
};

export const replacePage = (from: Node | null, to: string | Node | null) => {
  if (!from || !to) {
    return;
  }

  Alpine.morph(from, to, {
    updated(from, to) {
      _handleTemplates(from, to);
    },
  });
};
