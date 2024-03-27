type ResizableConfig = {
  id: string;
};

type ResizableContainer = {
  width: number;
  height: number;
};

export type ResizableStoreType = {
  _current: Record<string, ResizableContainer>;
  _register: (config: ResizableConfig) => void;
  _unregister: (areaId: string) => void;
  show: (id: string) => void;
  hide: (id: string) => void;
  hideAll: () => void;
  __observer: ResizeObserver | null;
  __onResize: (entries: ResizeObserverEntry[]) => void;
};

let _all: Record<string, ResizableConfig> = {};

export const ResizableStore = <ResizableStoreType>{
  _current: {},

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
      }
    }
  },

  init() {
    this.__observer = new ResizeObserver(this.__onResize.bind(this));
  },

  _register(config: ResizableConfig) {
    _all[config.id] = config;
  },

  _unregister(areaId: string) {
    delete _all[areaId];
  },

  async show(id) {
    const config = _all[id];

    const isAlreadyOpen = Object.keys(this._current).length > 0;

    if (isAlreadyOpen) {
      Object.keys(this._current).forEach((id) => {
        this.hide(id);
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 300);
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

    this.__observer?.observe(document.getElementById(id)!);
  },

  hide(id) {
    this.__observer?.unobserve(document.getElementById(id)!);
    delete this._current[id];
  },

  hideAll() {
    Object.keys(this._current).forEach((id) => {
      this.hide(id);
    });
  },
};
