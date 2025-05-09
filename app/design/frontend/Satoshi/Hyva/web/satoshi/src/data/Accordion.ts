import type { Magics } from "alpinejs";

export type AccordionType = {
  _buttonRef: HTMLElement | null;
  _panelRef: HTMLElement | null;
  _iconRef: HTMLElement | null;
  __mutationObserver: MutationObserver | null;

  isExpanded: boolean;
  duration: number;

  init(): void;
  _initElements(): void;
  _toggle(): void;
  _update(): void;
  destroy(): void;
} & Magics<{}>;

export const Accordion = (
  isExpanded: unknown = false,
  duration: unknown = 0,
  onlyMobile: boolean = false,
) =>
  <AccordionType>{
    _buttonRef: null,
    _panelRef: null,
    _iconRef: null,
    __mutationObserver: null,

    isExpanded: Boolean(isExpanded),
    duration: Number(duration),

    init() {
      if (onlyMobile && !Alpine.store("main").isMobile) {
        return;
      }

      this._initElements();
      Alpine.nextTick(() => {
        this._update();
        this.$watch("isExpanded", this._update.bind(this));
      });

      this.__mutationObserver = new MutationObserver(() => {
        this._update();
      });

      this.__mutationObserver.observe(
        this._panelRef!,
        {
          childList: true,
          subtree: true,
        },
      );
    },

    _initElements() {
      this._buttonRef = this.$refs.AccordionButton;
      this._panelRef = this.$refs.AccordionPanel;
      this._iconRef = this.$refs.AccordionIcon;

      if (this._buttonRef) {
        this._buttonRef.addEventListener("click", this._toggle.bind(this));
      }

      if (this._panelRef) {
        this._panelRef.style.transitionDuration = `${this.duration}ms`;
      }

      if (this._iconRef) {
        this._iconRef.style.transitionProperty = "rotate";
        this._iconRef.style.transitionDuration = `${this.duration}ms`;
      }
    },

    _toggle() {
      this.isExpanded = !this.isExpanded;
    },

    _update() {
      if (this._panelRef) {
        this._panelRef.style.opacity = this.isExpanded ? "1" : "0";
        const containerMaxHeight = this._panelRef.scrollHeight
          ? `${this._panelRef.scrollHeight}px`
          : "10000px";
        this._panelRef.style.maxHeight = this.isExpanded
          ? containerMaxHeight
          : "0";
      }

      if (this._iconRef) {
        this._iconRef.style.rotate = this.isExpanded ? "-180deg" : "";
      }
    },

    destroy() {
      this.__mutationObserver?.disconnect();
      this.__mutationObserver = null;
    }
  };
