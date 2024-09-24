import { Magics } from "alpinejs";
import { ESC_KEY } from "../utils/keyboard-keys";
import { navigateWithTransition } from "../plugins/Transition";

export type AddressType = {
  renderedPage: string;
  address: Record<string, any>;
  province: string | null;
  deleteId: number | null;
  editId: number | null;
  focusableEl: HTMLElement | null;

  init(): void;
  showForm(page: any, popup_id: any): void;
  hideForm(): void;
  updateCountry(e: Event): void;
  _updateProvince(country: HTMLSelectElement): void;
  _onKeyDown(e: KeyboardEvent): void;
  _focusOnForm(popup_id: string): void;
  fetchAndReplaceContent(url: string): void;
} & Magics<{}>;

export const Address = () =>
  <AddressType>{
    renderedPage: "",
    address: {},
    province: null,
    deleteId: null,
    editId: null,

    _onKeyDown(e) {
      if (e.key === ESC_KEY) {
        this.hideForm();
      }
    },

    showForm(page: any, popup_id: any) {
      this.focusableEl = document.activeElement as HTMLElement;
      document.addEventListener("keydown", this._onKeyDown.bind(this));
      this._updateProvince(this.$refs.address_country as HTMLSelectElement);

      if (Alpine.store("main").isMobile) {
        Alpine.store("popup").showPopup(popup_id, true);
        return;
      }

      this.renderedPage = page;
      this._focusOnForm(popup_id);
    },

    _focusOnForm(popup_id) {
      // Focus on first form element
      setTimeout(() => {
        const firstEl = document
          .querySelector(`#${popup_id}-desktop form`)
          ?.querySelector(
            "a, button, textarea, input:not([type=hidden]), select",
          ) as HTMLElement;
        firstEl?.focus();
      }, 150);
    },

    hideForm() {
      document.removeEventListener("keydown", this._onKeyDown);
      this.renderedPage = "";
      this.address = {};
      this.deleteId = null;
      this.editId = null;

      setTimeout(() => {
        this.focusableEl?.focus();
        this.focusableEl = null;
      }, 150);
    },

    updateCountry(e: Event) {
      const country = e.target as HTMLSelectElement;
      this.address.country = country.selectedOptions[0].text;
      this._updateProvince(country);
    },

    _updateProvince(country) {
      Alpine.nextTick(() => {
        this.province = JSON.parse(
          country?.selectedOptions[0].dataset.provinces || "[]",
        );
      });
    },

    fetchAndReplaceContent(url: string) {
      if (!url) return;

      navigateWithTransition(url);
    },
  };
