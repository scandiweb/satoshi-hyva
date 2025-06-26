import { Magics } from "alpinejs";

export type RecaptchaType = {
  initRecaptchaCheckbox(): void;
  initRecaptchaInvisible(): void;
} & Magics<{}>;

export type RecaptchaPropsType = {
  containerId: string;
  siteKey: string;
  instanceId: string;
  callback: string;
  badge: ReCaptchaV2.Badge;
};

export const Recaptcha = ({
  containerId,
  siteKey,
  instanceId,
  callback,
  badge
}: RecaptchaPropsType) => {
  return <RecaptchaType>{
    initRecaptchaCheckbox() {
      const initRecaptcha = () => {
        grecaptchaV2LoadCallbacks.push(() => {
          grecaptcha.render(containerId, {sitekey: siteKey});
        });
        const container = document.getElementById(containerId);
        /* Polyfill element.closest until 98% support is available (at 97.03% at the time of writing), see https://caniuse.com/?search=element.closest */
        if (container && ! container.closest) {
          container.closest = function (s: string) {
            let el: HTMLElement | null = container;
            do {
              if (el.matches(s)) return el;
              el = (el.parentElement || el.parentNode) as HTMLElement | null;
            } while (el !== null && el.nodeType === 1);
          }
        }
        forceLoadRecaptchaScript((document.getElementById(containerId) as HTMLElement).closest('form'));
      };

      // Dynamically rendered forms (eg. via Alpine or Magewire) are rendered post DOMContentLoaded event trigger
      if (document.readyState !== 'loading') {
        // Wait for 'nextTick' for alpine/magewire to finish re-rendering markup
        setTimeout(() => {
          initRecaptcha();
        });
      } else {
        document.addEventListener('DOMContentLoaded', initRecaptcha);
      }
    },

    initRecaptchaInvisible() {
      const initRecaptcha = () => {
        grecaptchaV2LoadCallbacks.push(() => {
          window[instanceId] = window.grecaptcha.render(containerId, {
            sitekey: siteKey,
            callback: callback as any,
            size: 'invisible',
            badge: badge,
          });
        });
      };

      // Dynamically rendered forms (eg. via Alpine or Magewire) are rendered post DOMContentLoaded event trigger
      if (document.readyState !== 'loading') {
        // Wait for 'nextTick' for alpine/magewire to finish re-rendering markup
        setTimeout(() => {
          initRecaptcha();
          forceLoadRecaptchaScript((document.getElementById(containerId) as HTMLElement).closest('form'));
        });
      } else {
        document.addEventListener('DOMContentLoaded', initRecaptcha);
      }
    }
  };
};
