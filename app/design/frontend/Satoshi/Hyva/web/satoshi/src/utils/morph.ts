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
  resetInputValues?: boolean,
) => {
  if (!from || !to) {
    return;
  }

  Alpine.morph(from, to, {
    updating(
      from: Node,
      to: Node,
      _childrenOnly: VoidFunction,
      skip: VoidFunction,
    ) {
      // ignore elements with x-morph-ignore attribute
      if (from instanceof Element && from.hasAttribute("x-morph-ignore")) {
        skip();
        return;
      }

      // handle images
      if (from instanceof HTMLImageElement && to instanceof HTMLImageElement) {
        const fromSrc = from.src.replace(/^https?:\/\//, "//");
        const toSrc = to.src.replace(/^https?:\/\//, "//");

        if (fromSrc === toSrc && from.complete) {
          skip();
          return;
        }
      }
    },
    updated(from, to) {
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
