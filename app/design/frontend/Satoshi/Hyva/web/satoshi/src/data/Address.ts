import { Magics } from "alpinejs";
import { navigateWithTransition } from "../plugins/Transition";

export type AddressType = {
  isLoading: boolean;

  deleteAddress(
    address_id: string,
    confirm_message: string,
    deleteUrl: string,
  ): void;
  createOrUpdateAddress(): void;
} & Magics<{}>;

export const Address = () =>
  <AddressType>{
    isLoading: false,

    deleteAddress(address_id, confirm_message, deleteUrl) {
      if (window.confirm(confirm_message)) {
        this.isLoading = true;
        const formData = new FormData();
        formData.append("form_key", window.hyva.getFormKey());
        formData.append("uenc", window.hyva.getUenc());
        formData.append("id", address_id);

        fetch(deleteUrl, {
          method: "POST",
          body: formData,
        })
          .then((result) => {
            return result.text();
          })
          .then((content) => {
            window.hyva.replaceDomElement("#address-list-wrapper", content);
          })
          .catch((error) => {
            console.error("Error while deleting address:", error);
            location.reload();
          })
          .finally(() => {
            this.isLoading = false;
          });
      }
    },

    createOrUpdateAddress() {
      const $form = document.getElementById("form-validate") as HTMLFormElement;
      if (!$form) return;

      this.isLoading = true;
      const formData = new FormData($form);

      fetch($form.action, {
        method: "POST",
        body: formData,
      })
        .then((res) => {
          if (res.ok) {
            navigateWithTransition("/customer/address/");
          }
        })
        .catch((error) => {
          console.error("Error while creating or updating address:", error);
          location.reload();
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
  };
