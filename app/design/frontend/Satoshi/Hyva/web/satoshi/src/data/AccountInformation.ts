import { Magics } from "alpinejs";
import { navigateWithTransition } from "../plugins/Transition";

export type AccountInformationType = {
    isLoading: boolean;
    handleFormSubmit(): void;
} & Magics<{}>;

export const AccountInformation = () =>
    <AccountInformationType>{
    isLoading: false,

    handleFormSubmit() {
        const $form = document.getElementById('form-validate') as HTMLFormElement;
        if (!$form) return;

        const formData = new FormData($form);
        this.isLoading = true;

        fetch($form.action, {
            method: "POST",
            body: formData,
        }).then((res) => {
            if (res.ok) {
                navigateWithTransition('/customer/account');
            }
        }).catch((error) => {
            console.error("Error while updating account information:", error);
            location.reload();
        }).finally(() => {
            this.isLoading = false;
        });
    },
};
