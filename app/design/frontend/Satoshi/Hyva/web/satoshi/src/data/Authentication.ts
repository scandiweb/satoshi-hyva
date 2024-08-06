import { MainStoreType } from "../store/Main";

export type AuthenticationType = {
    [key: string | symbol]: any;

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

export const Authentication = (...args: unknown[]): AuthenticationType => {
    const [recaptchaInstance] = args;

    console.log('holaaa');

    return <AuthenticationType>{
        errors: 0,
        hasCaptchaToken: false,
        showPassword: false,
        displayErrorMessage: false,
        errorMessages: {},
        generalErrorMessage: '',

        init() {
            console.log('init');
        },

        clearError(field) {
            this.errorMessages[field] = '';
        },

        setErrorMessages(messages) {
            this.errorMessages = messages;
            this.displayErrorMessage = true;
        },

        submitForm(event) {
            event.preventDefault();

            const form = document.querySelector('#customer-login-form') as HTMLFormElement;
            if (!form) {
                console.error('Form not found');
                return;
            }

            if (recaptchaInstance && typeof recaptchaInstance.getResponse === 'function') {
                const token = recaptchaInstance.getResponse();
                if (!token) {
                    this.generalErrorMessage = 'Please complete the reCAPTCHA.';
                    this.displayErrorMessage = true;
                    return;
                }
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
