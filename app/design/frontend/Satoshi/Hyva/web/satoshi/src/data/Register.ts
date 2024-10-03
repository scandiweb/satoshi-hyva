import {Magics} from "alpinejs";
import {navigateWithTransition} from "../plugins/Transition";

export type RegisterType = {
    isLoading: boolean;
    handleFormSubmit(): void;
} & Magics<{}>;

export const Register = () =>
    <RegisterType>{
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
                    // After merging the INTERNAL-53, https://github.com/satoshiux/hyva/pull/19/files
                    // we can use the line below instead of the line above
                    // navigateWithTransition('/customer/account', { replaceDocument: true });
                }
            }).catch((error) => {
                console.error("Error while registering account:", error);
                location.reload();
            }).finally(() => {
                this.isLoading = false;
            });
        },
    };
