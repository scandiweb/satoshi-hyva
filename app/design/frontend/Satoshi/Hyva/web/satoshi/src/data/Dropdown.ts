import type { Magics } from "alpinejs";
import { ESC_KEY } from "../utils/keyboard-keys";

export type DropdownType = {
  isDropdownVisible: boolean;
  _dropdownWrapper: HTMLElement | null;

  init(): void;
  _onClick(event: MouseEvent): void;
  _onKeydown(event: KeyboardEvent): void;

  toggleDropdown(): void;
  show(): void;
  hide(): void;
  search(value: string): void;
} & Magics<{}>;

export const Dropdown = () =>
  <DropdownType>{
    isDropdownVisible: false,
    _dropdownWrapper: null,
    _onClick: (_event) => {},
    _onKeydown: (_event) => {},

    init() {
      Alpine.nextTick(() => {
        this._dropdownWrapper = this.$refs.DropdownWrapper;
      });
    },

    toggleDropdown() {
      if (this.isDropdownVisible) {
        this.hide();
      } else {
        this.show();
      }
    },

    show() {
      this.isDropdownVisible = true;

      this._onClick = (e) => {
        if (!this._dropdownWrapper?.contains(e.target as Node)) {
          this.hide();
        }
      };

      // Hide when clicked outside
      document.addEventListener("click", this._onClick);

      this._onKeydown = (e) => {
        const isEscPressed = e.key === ESC_KEY;

        if (isEscPressed) {
          this.hide();
        }
      };

      // Hide when Esc is pressed
      document.addEventListener("keydown", this._onKeydown);
    },

    hide() {
      this.isDropdownVisible = false;

      document.removeEventListener("click", this._onClick);
      document.removeEventListener("keydown", this._onKeydown);
    },

    search(value) {
      const options = this._dropdownWrapper?.querySelectorAll("li a");
      options?.forEach((option) => {
        const optionValue = (option as HTMLElement).outerText.toLowerCase();
        const match = optionValue.includes(value.toLowerCase());

        option.classList.toggle("hidden", !match);
      });
    },
  };
