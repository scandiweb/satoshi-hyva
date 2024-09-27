import { Magics } from "alpinejs";
import { navigateWithTransition } from "../plugins/Transition";

export type AccountInformationType = {
    fetchAndReplaceContent(url: string): void;
    updateAccount(): void;
} & Magics<{}>;

export const AccountInformation = () =>
    <AccountInformationType>{
        fetchAndReplaceContent(url: string) {
            if (!url) return;

            navigateWithTransition(url);
        },

        updateAccount() {
            const form = document.getElementById('form-validate') as HTMLFormElement;
            if (!form) return;
            const formData = new FormData(form);

            fetch("/customer/account/editPost", {
                method: "POST",
                body: formData,
            }).then((res) => {
                if (res.ok) {
                    navigateWithTransition('/customer/account');
                }
            }).catch((error) => {
                console.error("Error while updating account information:", error);
                location.reload();
            });
        },
    };
