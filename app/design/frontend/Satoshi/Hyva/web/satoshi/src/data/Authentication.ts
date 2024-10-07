import {replaceMainContent, replaceMainContentWithTransition} from "../plugins/Transition";
import {MainStoreType} from "../store/Main";

export type AuthenticationType = {
    displayErrorMessage: boolean;
    errorMessages: Record<string, string>;
    generalErrorMessage: string;

    clearError(field: string): void;
    setErrorMessages(messages: Record<string, string>): void;
    submitForm(event: Event, formId: string): void;
    submitAuthForm(formId: string): void;
} & MainStoreType;

export const Authentication = (recaptchaValidation?: string) => {
    return <AuthenticationType>{
        displayErrorMessage: false,
        errorMessages: {},
        generalErrorMessage: "",

        clearError(field) {
            this.errorMessages[field] = "";
        },

        setErrorMessages(messages) {
            this.errorMessages = {...this.errorMessages, ...messages};
            this.displayErrorMessage = true;
        },

        submitForm(event, formId) {
            event.preventDefault();

            const form = document.querySelector(`#${formId}`) as HTMLFormElement;
            if (!form) {
                return;
            }

            fetch(form.action, {
                method: "POST",
                body: new FormData(form),
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        form.submit();
                    } else {
                        this.setErrorMessages({[data.field]: data.message});
                    }
                })
                .catch((error) => {
                    this.generalErrorMessage = error.message();
                    this.displayErrorMessage = true;
                });
        },

        submitAuthForm(formId) {
            const $form = document.getElementById(formId) as HTMLFormElement;
            eval(recaptchaValidation);
            if (this.errors === 0) {
                this.errorMessages = {};
                const formData = new FormData($form);
                fetch($form.action, {
                    method: "POST",
                    body: formData,
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                    },
                })
                    .then((response) => {
                        return response.text().then(async (content) => {
                            await replaceMainContent(content);
                        });
                    })
                    .catch((error) => {
                        this.setErrorMessages({'request error': error.message});
                    });
            }
        },
    };
};
