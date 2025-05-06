import type { Alpine as AlpineType } from "alpinejs";

type IntersectionModifiers = Array<string>;

export default function (Alpine: AlpineType) {
  Alpine.directive(
    "intersect",
    Alpine.skipDuringClone(
      (
        element,
        { value, expression, modifiers },
        { evaluateLater, cleanup, effect },
      ) => {
        // call when the element is intersecting
        const evaluate = evaluateLater(expression);

        const observerOptions = {
          rootMargin: getRootMargin(modifiers),
          threshold: getThreshold(modifiers),
        };

        let isVisibleRef: boolean | null = null;
        let observerTimeoutRef: NodeJS.Timeout | null = null;

        let observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const newIsVisible = entry.isIntersecting;

            if (isVisibleRef === newIsVisible) {
              return;
            }

            isVisibleRef = newIsVisible;
            element._x_visible = newIsVisible;

            // Ignore entry if intersecting in leave mode, or not intersecting in enter mode
            if (newIsVisible === (value === "leave")) {
              return;
            }

            evaluate();

            modifiers.includes("once") && observer.disconnect();
          });
        }, observerOptions);

        let prevIsFocused = Alpine.store("popup").isCurrentPopupFocused;

        effect(() => {
          const isFocused = Alpine.store("popup").isCurrentPopupFocused;

          if (prevIsFocused !== isFocused) {
            prevIsFocused = isFocused;
            observer.unobserve(element);

            if (observerTimeoutRef) {
              clearTimeout(observerTimeoutRef);
            }

            observerTimeoutRef = setTimeout(() => {
              observerTimeoutRef = null;
              observer.observe(element);
            }, getDelay(modifiers));
          }
        });

        observer.observe(element);

        cleanup(() => {
          observer.disconnect();
        });
      },
    ),
  );
}

function getThreshold(modifiers: IntersectionModifiers) {
  if (modifiers.includes("full")) return 0.99;
  if (modifiers.includes("half")) return 0.5;
  if (!modifiers.includes("threshold")) return 0;

  let threshold = modifiers[modifiers.indexOf("threshold") + 1];

  if (threshold === "100") return 1;
  if (threshold === "0") return 0;

  return Number(`.${threshold}`);
}

export function getLengthValue(rawValue: string) {
  // Supported: -10px, -20 (implied px), 30 (implied px), 40px, 50%
  let match = rawValue.match(/^(-?[0-9]+)(px|%)?$/);
  return match ? match[1] + (match[2] || "px") : undefined;
}

export function getRootMargin(modifiers: IntersectionModifiers) {
  const key = "margin";
  const fallback = "0px 0px 0px 0px";
  const index = modifiers.indexOf(key);

  // If the modifier isn't present, use the default.
  if (index === -1) return fallback;

  // Grab the 4 subsequent length values after it: x-intersect.margin.300px.0.50%.0
  let values = [];
  for (let i = 1; i < 5; i++) {
    values.push(getLengthValue(modifiers[index + i] || ""));
  }

  // Filter out undefined values (not a valid length)
  values = values.filter((v) => v !== undefined);

  return values.length ? values.join(" ").trim() : fallback;
}

export function getDelay(modifiers: IntersectionModifiers) {
  if (!modifiers.includes("delay")) return 500;

  let delay = modifiers[modifiers.indexOf("delay") + 1];
  return Number(delay);
}
