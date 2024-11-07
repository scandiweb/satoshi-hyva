import { Magics } from "alpinejs";

export type AddressType = {
  isLoading: boolean;

  deleteAddress(
    addressId: string,
    confirmMessage: string,
    deleteUrl: string,
  ): void;
} & Magics<{}>;

export const Address = () =>
  <AddressType>{
    isLoading: false,

    deleteAddress(addressId, confirmMessage, deleteUrl) {
      if (window.confirm(confirmMessage)) {
        this.isLoading = true;
        const formData = new FormData();
        formData.append("form_key", window.hyva.getFormKey());
        formData.append("uenc", window.hyva.getUenc());
        formData.append("id", addressId);

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
  };
