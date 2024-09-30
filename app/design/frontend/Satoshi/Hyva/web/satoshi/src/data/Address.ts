import { Magics } from "alpinejs";
import { ESC_KEY } from "../utils/keyboard-keys";
import { navigateWithTransition } from "../plugins/Transition";

export type AddressType = {
  isLoading: boolean;
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
  deleteAddress(address_id: string, confirm_message: string): void;
  createOrUpdateAddress(): void;
} & Magics<{}>;

export const Address = () =>
  <AddressType>{
    isLoading: false,
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

    deleteAddress(address_id, confirm_message) {
        if (window.confirm(confirm_message)) {
            this.isLoading = true;
            const formData = new FormData();
            formData.append("form_key", window.hyva.getFormKey());
            formData.append("uenc", window.hyva.getUenc());
            formData.append("id", address_id);

            fetch('/customer/address/delete', {
                method: "POST",
                body: formData,
            }).then((result) => {
                return result.text();
            }) .then((content) => {
                window.hyva.replaceDomElement("#address-list-wrapper", content);
            }).catch((error) => {
                console.error("Error while deleting address:", error);
                location.reload();
            }).finally(() => {
                this.isLoading = false
            });
        }
    },

    createOrUpdateAddress() {
        const $form = document.getElementById('form-validate') as HTMLFormElement;
        if (!$form) return;

        this.isLoading = true;
        const formData = new FormData($form);

        fetch($form.action, {
            method: "POST",
            body: formData,
        }).then((res) => {
            if (res.ok) {
                navigateWithTransition('/customer/address/');
            }
        }).catch((error) => {
            console.error("Error while creating or updating address:", error);
            location.reload();
        }).finally(() => {
            this.isLoading = false
        });
    },
  };
