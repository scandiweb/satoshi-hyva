import { MainStoreType } from "../store/Main";

export type AuthenticationType = {
    errors: number;
    hasCaptchaToken: boolean;
    showPassword: boolean;
    displayErrorMessage: boolean;
    errorMessages: Record<string, string>;
    generalErrorMessage: string;

    init(): void;
    clearError(field: string): void;
    setErrorMessages(messages: Record<string, string>): void;
    submitForm(event: Event): void;
} & MainStoreType;

export const Authentication = (formId: string) => {
    return <AuthenticationType>{
        errors: 0,
        hasCaptchaToken: false,
        showPassword: false,
        displayErrorMessage: false,
        errorMessages: {},
        generalErrorMessage: '',

        clearError(field) {
            this.errorMessages[field] = '';
        },


        setErrorMessages(messages) {
            this.errorMessages = messages;
            this.displayErrorMessage = true;
        },

        submitForm(event) {
            event.preventDefault();

            const form = document.querySelector(`#${formId}`) as HTMLFormElement;
            if (!form) {
                return;
            }

            fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        form.submit();
                    } else {
                        this.setErrorMessages({ [data.field]: data.message });
                    }
                })
                .catch(error => {
                    this.generalErrorMessage = error.message();
                    this.displayErrorMessage = true;
                });
        }
    };
};
