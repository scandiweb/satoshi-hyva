import type { Magics } from "alpinejs";

export type AccordionType = {
  [key: string | symbol]: any;

  _buttonRef: HTMLElement | null;
  _panelRef: HTMLElement | null;
  _iconRef: HTMLElement | null;

  isExpanded: boolean;
  duration: number;

  init(): void;
  _initElements(): void;
  _toggle(): void;
  _update(): void;
} & Magics<{}>;

export const Accordion = (isExpanded: unknown = false, duration: unknown = 0) =>
  <AccordionType>{
    _buttonRef: null,
    _panelRef: null,
    _iconRef: null,

    isExpanded: Boolean(isExpanded),
    duration: Number(duration),

    init() {
      this._initElements();
      this._update();

      this.$watch("isExpanded", this._update.bind(this));
    },

    _initElements() {
      this._buttonRef = this.$refs.AccordionButton;
      this._panelRef = this.$refs.AccordionPanel;
      this._iconRef = this.$refs.AccordionIcon;

      if (this._buttonRef) {
        this._buttonRef.addEventListener("click", this._toggle.bind(this));
      }

      if (this._panelRef) {
        this._panelRef.style.transitionProperty = "max-height, opacity";
        this._panelRef.style.transitionDuration = `${this.duration}ms`;
        this._panelRef.style.overflow = "hidden";
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
        const containerMaxheight = this._panelRef.scrollHeight
          ? `${String(this._panelRef.scrollHeight)}px`
          : "none";
        this._panelRef.style.maxHeight = this.isExpanded
          ? containerMaxheight
          : "0";
      }

      if (this._iconRef) {
        this._iconRef.style.rotate = this.isExpanded ? "-180deg" : "";
      }
    },
  };
