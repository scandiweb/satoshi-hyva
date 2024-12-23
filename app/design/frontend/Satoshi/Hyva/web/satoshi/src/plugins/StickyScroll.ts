import type { Alpine as AlpineType } from "alpinejs";

type ElementWithXAttributes<T extends HTMLElement> = T & {
  _x_endScroll: number;
  _x_currPos: number;
  _x_screenHeight: number;
  _x_stickyElementHeight: number;
  _x_scroll_listener: () => void;
  _x_resize_listener: () => void;
};

const TOP_VAR = "--scroll-top";

export default function (Alpine: AlpineType) {
  Alpine.directive(
    "sticky-scroll",
    (stickyElement, { expression }, { evaluate, cleanup }) => {
      const {
        container,
        top: topGap,
        bottom: bottomGap,
      } = evaluate(expression) as {
        container: HTMLElement | any;
        top: number;
        bottom: number;
      };

      const scrollTarget =
        container instanceof HTMLElement
          ? (container as HTMLElement)
          : document;

      const propertyTarget =
        container instanceof HTMLElement
          ? (container as ElementWithXAttributes<HTMLElement>)
          : (document.getElementById(
            "MainContent",
          ) as ElementWithXAttributes<HTMLElement>);

      const getScrollTargetScrollY = () => {
        if (container instanceof HTMLElement) {
          return container.scrollTop;
        } else {
          return window.scrollY;
        }
      };

      const getHeightOfTarget = () => {
        return window.innerHeight;

        // if (scrollTarget instanceof HTMLElement) {
        //   return scrollTarget.offsetHeight;
        // } else {
        //   return window.innerHeight;
        // }
      };

      const positionStickySidebar = () => {
        propertyTarget._x_endScroll =
          propertyTarget._x_screenHeight -
          stickyElement.offsetHeight -
          bottomGap;

        let stickyElementTop = parseInt(
          propertyTarget.style.getPropertyValue(TOP_VAR).replace("px", ""),
          10,
        );

        if (
          propertyTarget._x_stickyElementHeight + topGap + bottomGap >
          propertyTarget._x_screenHeight
        ) {
          if (getScrollTargetScrollY() < propertyTarget._x_currPos) {
            //Scroll up
            if (stickyElementTop < topGap) {
              propertyTarget.style.setProperty(
                TOP_VAR,
                `${stickyElementTop + propertyTarget._x_currPos - getScrollTargetScrollY()}px`,
              );
            } else if (
              stickyElementTop >= topGap &&
              stickyElementTop != topGap
            ) {
              propertyTarget.style.setProperty(TOP_VAR, `${topGap}px`);
            }
          } else {
            //Scroll down
            if (stickyElementTop > propertyTarget._x_endScroll) {
              propertyTarget.style.setProperty(
                TOP_VAR,
                `${stickyElementTop + propertyTarget._x_currPos - getScrollTargetScrollY()}px`,
              );
            } else if (
              stickyElementTop < propertyTarget._x_endScroll &&
              stickyElementTop != propertyTarget._x_endScroll
            ) {
              propertyTarget.style.setProperty(
                TOP_VAR,
                `${propertyTarget._x_endScroll}px`,
              );
            }
          }
        } else {
          propertyTarget.style.setProperty(TOP_VAR, `${topGap}px`);
        }

        propertyTarget._x_currPos = getScrollTargetScrollY();
      };

      function updateSticky() {
        propertyTarget._x_screenHeight = getHeightOfTarget();
        propertyTarget._x_stickyElementHeight = stickyElement.offsetHeight;
        positionStickySidebar();
      }

      function onResize() {
        propertyTarget._x_currPos = getScrollTargetScrollY();
        updateSticky();
      }

      propertyTarget._x_endScroll =
        getHeightOfTarget() - stickyElement.offsetHeight - 500;
      propertyTarget._x_currPos = getScrollTargetScrollY();
      propertyTarget._x_screenHeight = getHeightOfTarget();
      propertyTarget._x_stickyElementHeight = stickyElement.offsetHeight;
      propertyTarget.style.setProperty(TOP_VAR, `${topGap.toString()}px`);
      propertyTarget._x_scroll_listener = updateSticky;
      propertyTarget._x_resize_listener = onResize;

      window.addEventListener("resize", propertyTarget._x_resize_listener);

      scrollTarget.addEventListener(
        "scroll",
        propertyTarget._x_scroll_listener,
        {
          capture: true,
          passive: true,
        },
      );

      cleanup(() => {
        scrollTarget.removeEventListener(
          "scroll",
          propertyTarget._x_scroll_listener,
          {
            capture: true,
          },
        );

        window.removeEventListener("resize", propertyTarget._x_resize_listener);

        propertyTarget._x_endScroll = 0;
        propertyTarget._x_currPos = 0;
        propertyTarget._x_screenHeight = 0;
        propertyTarget._x_stickyElementHeight = 0;
        propertyTarget.style.removeProperty(TOP_VAR);
      });
    },
  );
}
