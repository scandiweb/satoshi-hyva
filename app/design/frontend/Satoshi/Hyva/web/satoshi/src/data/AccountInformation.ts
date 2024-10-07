import { Magics } from "alpinejs";
import { navigateWithTransition } from "../plugins/Transition";

export type AccountInformationType = {
    isLoading: boolean;
    handleFormSubmit(event: Event): void;
} & Magics<{}>;

export const AccountInformation = () =>
    <AccountInformationType>{
    isLoading: false,

    handleFormSubmit(event) {
        const $form = event.target as HTMLFormElement;
        if (!$form) return;

        const formData = new FormData($form);
        this.isLoading = true;

        fetch($form.action, {
            method: "POST",
            body: formData,
        }).then((res) => {
            if (res.ok) {
                navigateWithTransition($form.action);
            }
        }).catch((error) => {
            console.error("Error while updating account information:", error);
            location.reload();
        }).finally(() => {
            this.isLoading = false;
        });
    },
};
