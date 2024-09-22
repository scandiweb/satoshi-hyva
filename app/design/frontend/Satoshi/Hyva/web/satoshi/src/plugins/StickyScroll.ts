import type { Alpine as AlpineType } from "alpinejs";

type ElementWithXAttributes<T extends HTMLElement> = T & {
  _x_currId: string;
  _x_endScroll: number;
  _x_currPos: number;
  _x_screenHeight: number;
  _x_stickyElementHeight: number;
};

const TOP_VAR = "--scroll-top";

export default function (Alpine: AlpineType) {
  Alpine.directive(
    "sticky-scroll",
    (stickyElement, { expression }, { evaluate, cleanup }) => {
      const {
        id,
        container,
        top: topGap,
        bottom: bottomGap,
      } = evaluate(expression) as {
        id: string;
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

      const updateSticky = () => {
        if (propertyTarget._x_currId !== id) {
          return;
        }

        propertyTarget._x_screenHeight = getHeightOfTarget();
        propertyTarget._x_stickyElementHeight = stickyElement.offsetHeight;
        positionStickySidebar();
      };

      const onResize = () => {
        if (propertyTarget._x_currId !== id) {
          return;
        }

        // this breaks the sticky sidebar for some reason
        propertyTarget._x_currPos = getScrollTargetScrollY();
        updateSticky();
      };

      if (propertyTarget._x_currId !== id) {
        propertyTarget._x_currId = id;
        propertyTarget._x_endScroll =
          getHeightOfTarget() - stickyElement.offsetHeight - 500;
        propertyTarget._x_currPos = getScrollTargetScrollY();
        propertyTarget._x_screenHeight = getHeightOfTarget();
        propertyTarget._x_stickyElementHeight = stickyElement.offsetHeight;
        propertyTarget.style.setProperty(TOP_VAR, `${topGap.toString()}px`);

        window.addEventListener("resize", onResize);

        scrollTarget.addEventListener("scroll", updateSticky, {
          capture: true,
          passive: true,
        });
      }

      cleanup(() => {
        // TODO: investigate why this is not called
        propertyTarget._x_endScroll = 0;
        propertyTarget._x_currPos = 0;
        propertyTarget._x_screenHeight = 0;
        propertyTarget._x_stickyElementHeight = 0;
        propertyTarget.style.removeProperty(TOP_VAR);
        scrollTarget.removeEventListener("scroll", updateSticky);
        window.removeEventListener("resize", onResize);
      });
    },
  );
}
