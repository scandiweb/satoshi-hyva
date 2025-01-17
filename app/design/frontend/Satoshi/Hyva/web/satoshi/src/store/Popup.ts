import type { Magics } from "alpinejs";

import {
  freezeScroll,
  makeElementNotScrollable,
  makeElementScrollable,
  unfreezeScroll,
} from "../utils/scroll2";
import { isMobile } from "../utils/device";
import { ESC_KEY } from "../utils/keyboard-keys";
import { SELECTOR_LIST } from "../plugins/Accessibility";

// const POPUP_CONTENT_CHANGE_REQUEST_EVENT = "popup-content-change-request";
export const POPUP_OVERLAY_CLICK_EVENT = "popup-overlay-click";
export const POPUP_APPEARANCE_DURATION = 500;

export type PopupConfigType = {
  id: string;
  isFocused?: boolean;
  isFullScreen?: boolean;
  isAlwaysVisible?: boolean;
  isPreventOverlayClose?: boolean;
  overlayCallback?: () => void;
};

export type PopupStoreType = {
  currentPopup: string | null;
  isCurrentPopupFullScreen: boolean;
  isCurrentPopupFocused: boolean;
  originalFocusableEl: HTMLElement | null;

  __currentPopupRef: string | null;
  __nextPopupRef: string | null;
  __popupHistory: string[];
  __isNoRenderWhileHidingRef: boolean;
  __endOfHeaderHeight: number;
  __popupContentHeight: number;

  _nextPopup: string | null;
  _isPopupVisible: boolean;
  _isPopupContentHidden: boolean;
  _isPopupSimple: boolean;
  _popupContentRatio: number;
  _isMaxHeightReached: boolean;

  __isKeyboardVisibleRef: boolean;
  __prevWindowHeightRef: number;

  init(): void;
  _registerPopup(popup: PopupConfigType): void;
  _unregisterPopup(popup: PopupConfigType): void;
  _updatePopupConfig(popup: PopupConfigType): void;
  _onKeyDown(event: KeyboardEvent): void;
  extendPopupConfig(popup: PopupConfigType): void;
  hideAllPopups(): Promise<void>;
  hideCurrentPopup(): void;
  __updatePopupHeight(popup: string | null): void;
  __doSupportiveTransition(popup?: string | null): Promise<void>;
  showPopup(popup: string, isClosePrevious?: boolean): Promise<void>;
  hidePopup(popup: string): void;
  __getWindowHeight(): number;
  __updateScrollLockIfNeeded(): void;
  onPopupOverlayClick(): void;
  updateContentSize(): void;

  useOnPopupOverlayClick(popup: string, callback: () => void): void;
  __attachedOverlayCallback: (() => void) | null;
  __addOverlayCallback(callback: () => void): void;
  __removeOverlayCallback(): void;

  __mutationObserver: MutationObserver | null;
} & Partial<Magics<{}>>;

let __popups: PopupConfigType[] = [];

export const PopupStore = <PopupStoreType>{
  currentPopup: null,
  isCurrentPopupFullScreen: false,
  isCurrentPopupFocused: false,
  originalFocusableEl: null,

  __currentPopupRef: null,
  __nextPopupRef: null,
  __popupHistory: [],
  __isNoRenderWhileHidingRef: false,
  __endOfHeaderHeight: 0,
  __popupContentHeight: 0,

  _nextPopup: null,
  _isPopupVisible: false,
  _isPopupSimple: false,
  _popupContentRatio: 0,
  _isMaxHeightReached: false,
  _isPopupContentHidden: false,

  __isKeyboardVisibleRef: false,
  __prevWindowHeightRef: 0,
  __mutationObserver: null,
  __attachedOverlayCallback: null,

  init() {
    Alpine.effect(() => {
      const currentPopupConfig = __popups.find(
        (popup) => popup.id === this.__currentPopupRef
      );

      const nextPopupConfig = __popups.find(
        (popup) => popup.id === this.__nextPopupRef
      );

      const isPopupContentHidden = this.__nextPopupRef !== null;
      const isPopupVisible = !!this.currentPopup;

      const isPopupFocused = !isPopupContentHidden
        ? currentPopupConfig?.isFocused
        : nextPopupConfig?.isFocused;

      const isPopupFullScreen = !isPopupContentHidden
        ? currentPopupConfig?.isFullScreen
        : nextPopupConfig?.isFullScreen;

      const isPopupSimple = !isPopupContentHidden
        ? currentPopupConfig && !isPopupFocused
        : nextPopupConfig && !isPopupFocused;

      const overlayCallback = !isPopupContentHidden
        ? currentPopupConfig?.overlayCallback
        : nextPopupConfig?.overlayCallback;

      const isMaxHeightReached =
        this.__popupContentHeight >
        this.__getWindowHeight() - this.__endOfHeaderHeight - 8 * 4;

      this.isCurrentPopupFocused = !!isPopupFocused;
      this.isCurrentPopupFullScreen = !!isPopupFullScreen;

      this._isPopupVisible = !!isPopupVisible;
      this._isPopupSimple = !!isPopupSimple;
      this._isMaxHeightReached = isMaxHeightReached;
      this._isPopupContentHidden = isPopupContentHidden;

      if (isPopupFocused) {
        freezeScroll();

        this.__mutationObserver = new MutationObserver(() => {
          this.__updateScrollLockIfNeeded();
        });

        this.__mutationObserver.observe(
          document.getElementById("popup-content-portal")!,
          {
            childList: true,
            subtree: true,
            attributeFilter: ["class", "style"],
          }
        );
      } else {
        unfreezeScroll();

        if (this.__mutationObserver) {
          this.__mutationObserver.disconnect();
          this.__mutationObserver = null;
        }
      }

      if (!this._isMaxHeightReached) {
        Alpine.nextTick(() => {
          this.updateContentSize();
        });
      }

      setTimeout(() => {
        const popupContentRatio = (this.__popupContentHeight + 32) / 100;
        this._popupContentRatio = popupContentRatio;
      }, 0);

      if (overlayCallback) {
        this.__addOverlayCallback(overlayCallback);
      } else {
        this.__removeOverlayCallback();
      }
    });
  },

  _registerPopup(popup: PopupConfigType) {
    __popups.push(popup);

    if (popup.isAlwaysVisible) {
      this.showPopup(popup.id);
    }
  },

  _unregisterPopup(popup: PopupConfigType) {
    __popups = __popups.filter((p) => p.id !== popup.id);

    if (this.__popupHistory.includes(popup.id)) {
      this.hidePopup(popup.id);
    }
  },

  _updatePopupConfig(popup: PopupConfigType) {
    __popups = __popups.map((p) => {
      if (p.id === popup.id) {
        return popup;
      }

      return p;
    });
  },

  extendPopupConfig(popup: PopupConfigType) {
    const popupConfig = __popups.find((p) => p.id === popup.id);
    this._updatePopupConfig({
      ...popupConfig,
      ...popup,
    });
  },

  async hideAllPopups() {
    if (!isMobile()) {
      return;
    }

    this.__isNoRenderWhileHidingRef = true;
    this.__currentPopupRef = null;

    if (this.__isNoRenderWhileHidingRef) {
      await this.__doSupportiveTransition();
    }

    if (this.__isNoRenderWhileHidingRef) {
      await this.updateContentSize();
    }

    if (this.__isNoRenderWhileHidingRef) {
      await new Promise<void>((res) => {
        setTimeout(res, POPUP_APPEARANCE_DURATION / 4);
      });
    }

    if (this.__isNoRenderWhileHidingRef) {
      unfreezeScroll();

      this.currentPopup = null;
      this._isPopupVisible = false;
      this.__popupHistory = [];
    }
  },

  hideCurrentPopup() {
    if (!isMobile()) {
      return;
    }

    document.removeEventListener("keydown", this._onKeyDown);

    this.originalFocusableEl?.focus({ preventScroll: true });
    this.originalFocusableEl = null;

    const popup = this.__currentPopupRef;
    const popupConfig = __popups.find((p) => p.id === popup);

    if (popupConfig && popupConfig.isPreventOverlayClose) {
      // ignore overlay clicks for always visible popups
      return;
    }

    // remove last occurrence of the current popup from the end of the history
    // if there are duplicates immediately before it, remove them too,
    // if there are duplicates not immediately before it, keep them
    // eslint-disable-next-line no-plusplus
    for (let i = this.__popupHistory.length - 1; i >= 0; i--) {
      if (this.__popupHistory[i] === popup) {
        this.__popupHistory.pop();
      } else {
        break;
      }
    }

    const lastPopup = this.__popupHistory[this.__popupHistory.length - 1];

    if (!lastPopup) {
      this.hideAllPopups();
      return;
    }

    this.showPopup(lastPopup);
  },

  __updatePopupHeight(popup: string | null) {
    if (popup) {
      this.__popupContentHeight = document
        .getElementById("popup-content-portal")!
        .getBoundingClientRect().height;
    } else {
      this.__popupContentHeight = 0;
    }
  },

  async __doSupportiveTransition(popup: string | null = null) {
    const start = document
      .getElementById("end-of-header")!
      .getBoundingClientRect().top;
    this.__endOfHeaderHeight = start;

    this.__updatePopupHeight(popup);

    this.__nextPopupRef = popup;
    this._nextPopup = popup;

    if (!popup || Alpine.store("main").isReducedMotion) {
      // skip waiting for animation if closing popup or motion is reduced
      return;
    }

    await new Promise<void>((resolve) => {
      document.getElementById("popup-content")!.addEventListener(
        "transitionstart",
        () => {
          resolve();
        },
        { once: true }
      );
    });
  },

  async showPopup(popup: string, isClosePrevious: boolean = true) {
    if (!isMobile()) {
      return;
    }

    // Store closest tabbable element (i.e: clicked element is svg)
    this.originalFocusableEl = document.activeElement!.closest(SELECTOR_LIST);

    document.addEventListener("keydown", this._onKeyDown.bind(this));

    if (this.__currentPopupRef) {
      const currentPopupConfig = __popups.find(
        (p) => p.id === this.__currentPopupRef
      );

      const nextPopupConfig = __popups.find((p) => p.id === popup);

      if (
        currentPopupConfig &&
        currentPopupConfig.isFullScreen &&
        nextPopupConfig?.isFullScreen
      ) {
        this.__popupHistory.pop();
      }
    }

    if (!isClosePrevious && this.__currentPopupRef) {
      this.__popupHistory.unshift(popup);
      return;
    }

    const lastPopup = this.__popupHistory[this.__popupHistory.length - 1];

    if (lastPopup !== popup) {
      this.__popupHistory.push(popup);
    }

    const isAlreadyOpen = this.__currentPopupRef === popup;
    const popupConfig = __popups.find((p) => p.id === popup);

    if (!popupConfig) {
      return;
    }

    // giving the opportunity for hiding transition to begin
    await Promise.resolve();

    this.__isNoRenderWhileHidingRef = false;

    if (!isAlreadyOpen) {
      // we need to show popup
      await this.__doSupportiveTransition(popup);
    }

    const { isFocused } = popupConfig;

    if (isFocused) {
      freezeScroll();

      this.__mutationObserver = new MutationObserver(() => {
        this.__updateScrollLockIfNeeded();
      });

      this.__mutationObserver.observe(
        document.getElementById("popup-content-portal")!,
        {
          childList: true,
          subtree: true,
        }
      );
    } else {
      unfreezeScroll();

      if (this.__mutationObserver) {
        this.__mutationObserver.disconnect();
        this.__mutationObserver = null;
      }
    }

    try {
      // await new Promise<void>((resolve) => {
      //   const event = new CustomEvent(POPUP_CONTENT_CHANGE_REQUEST_EVENT, {
      //     detail: {
      //       popup,
      //       resolve,
      //       tag: Math.floor(Math.random() * 1000),
      //     },
      //   });

      //   document.dispatchEvent(event);
      // });

      Alpine.nextTick(() => {
        setTimeout(() => {
          this.__updatePopupHeight(popup);
        }, 100);

        this.__nextPopupRef = null;
        this.__currentPopupRef = popup;
        this.currentPopup = popup;
      });
    } catch (e) {
      // ignore
    }
  },

  _onKeyDown(e: KeyboardEvent) {
    const isEscPressed = e.key === ESC_KEY;

    if (isEscPressed) {
      this.hideCurrentPopup();
    }
  },

  hidePopup(popup: string) {
    if (popup === this.__currentPopupRef) {
      this.hideCurrentPopup();
    }
  },

  __getWindowHeight() {
    if (this.__isKeyboardVisibleRef) {
      return this.__prevWindowHeightRef;
    }

    const newWindowHeight = window.visualViewport
      ? window.visualViewport.height
      : window.screen.availHeight;

    this.__prevWindowHeightRef = newWindowHeight;

    return newWindowHeight;
  },

  __updateScrollLockIfNeeded() {
    const contentPortal = document.getElementById("popup-content-portal");

    if (!contentPortal) {
      return;
    }

    const scopedIsMaxHeightReached =
      contentPortal.scrollHeight >
      this.__getWindowHeight() - this.__endOfHeaderHeight - 8 * 4;

    if (scopedIsMaxHeightReached) {
      makeElementScrollable(contentPortal);
    } else {
      makeElementNotScrollable();
    }
  },

  onPopupOverlayClick() {
    const event = new CustomEvent(POPUP_OVERLAY_CLICK_EVENT);
    document.dispatchEvent(event);
    this.hideCurrentPopup();
  },

  updateContentSize() {
    this.__updatePopupHeight(this.__currentPopupRef);
    this.__updateScrollLockIfNeeded();

    document.getElementById("popup-content-portal")?.scrollTo({
      top: 0,
    });

    // TODO: setForcedRender({});
  },

  useOnPopupOverlayClick(popup: string, callback: () => void) {
    this.extendPopupConfig({ id: popup, overlayCallback: callback });
  },

  __addOverlayCallback(callback: () => void) {
    // Remove existing callback if it is a different one
    if (
      this.__attachedOverlayCallback &&
      this.__attachedOverlayCallback !== callback
    ) {
      this.__removeOverlayCallback();
    }

    // Attach callback if not yet added
    if (!this.__attachedOverlayCallback) {
      document.addEventListener(POPUP_OVERLAY_CLICK_EVENT, callback);
      this.__attachedOverlayCallback = callback;
    }
  },

  __removeOverlayCallback() {
    if (this.__attachedOverlayCallback) {
      document.removeEventListener(
        POPUP_OVERLAY_CLICK_EVENT,
        this.__attachedOverlayCallback
      );
      this.__attachedOverlayCallback = null;
    }
  },
};
