import { SELECTOR_LIST } from "../plugins/Accessibility";
import { ESC_KEY } from "../utils/keyboard-keys";
import { isDocumentFreezed, makeElementScrollable } from "../utils/scroll2";

type ResizableConfig = {
  id: string;
};

type ResizableContainer = {
  width: number;
  height: number;
};

export type ResizableStoreType = {
  _maxHeight: number;
  _current: Record<string, ResizableContainer>;
  originalFocusableEl: HTMLElement | null;
  _keyDownEventListener: (event: KeyboardEvent) => void;
  _register: (config: ResizableConfig) => void;
  _unregister: (areaId: string) => void;
  _onKeyDown(event: KeyboardEvent, id: string): void;
  show: (id: string, target?: HTMLElement | null) => void;
  hide: (id: string) => void;
  hideAll: () => void;
  isVisible: (id?: string | null) => boolean;
  __observer: ResizeObserver | null;
  __onResize: (entries: ResizeObserverEntry[]) => void;
};

let _all: Record<string, ResizableConfig> = {};

export const ResizableStore = <ResizableStoreType>{
  _current: {},

  originalFocusableEl: null,

  _keyDownEventListener: () => {},

  __observer: null,

  __onResize(entries) {
    for (const entry of entries) {
      const { id } = entry.target;

      if (!this._current[id]) {
        continue;
      }

      if (entry.contentBoxSize) {
        const { blockSize, inlineSize } = entry.contentBoxSize[0];

        this._current[id] = {
          width: inlineSize,
          height: blockSize,
        };

        if (isDocumentFreezed && blockSize < entry.target.scrollHeight) {
          makeElementScrollable(document.getElementById(id)!);
        }
      }
    }
  },

  _maxHeight: window.innerHeight - 66,

  init() {
    this.__observer = new ResizeObserver(this.__onResize.bind(this));

    document.addEventListener("resize", () => {
      this._maxHeight = window.innerHeight - 66;
    });
  },

  _register(config: ResizableConfig) {
    _all[config.id] = config;
  },

  _unregister(areaId: string) {
    delete _all[areaId];
  },

  _onKeyDown(e: KeyboardEvent, id: string) {
    const isEscPressed = e.key === ESC_KEY;

    if (isEscPressed) {
      this.hide(id);
    }
  },

  async show(id) {
    const config = _all[id];

    const isAlreadyOpen = Object.keys(this._current).length > 0;

    if (isAlreadyOpen) {
      Object.keys(this._current).forEach((id) => {
        this.hide(id);
      });
    }

    if (config) {
      const { width, height } = document
        .getElementById(id)!
        .getBoundingClientRect();

      this._current[id] = {
        width,
        height,
      };
    }

    const resizable = document.getElementById(id);
    this.__observer?.observe(resizable!);

    this._keyDownEventListener = (e: KeyboardEvent) => {
      this._onKeyDown(e, id);
    };
    document.addEventListener("keydown", this._keyDownEventListener);

    // Store closest tabbable element
    this.originalFocusableEl = document.activeElement!.closest(SELECTOR_LIST);
  },

  hide(id) {
    const wrapperEl = document.querySelector(
      ".resizable--visible .resizable__content--portal",
    );
    if (wrapperEl) {
      wrapperEl.removeAttribute("role");
      wrapperEl.removeAttribute("aria-modal");
      wrapperEl.removeAttribute("aria-labelledby");
    }

    const resizable = document.getElementById(id);
    this.__observer?.unobserve(resizable!);
    delete this._current[id];
    document.removeEventListener("keydown", this._keyDownEventListener);

    // Focus on original element that opened resizable
    resizable!.closest(".resizable")!.addEventListener(
      "transitionend",
      () => {
        this.originalFocusableEl?.focus();
      },
      { once: true },
    );
  },

  hideAll() {
    Object.keys(this._current).forEach((id) => {
      this.hide(id);
    });
  },

  isVisible(id = null) {
    const keys = Object.keys(this._current);

    if (id) {
      return keys.includes(id);
    }

    return keys.length;
  },
};
