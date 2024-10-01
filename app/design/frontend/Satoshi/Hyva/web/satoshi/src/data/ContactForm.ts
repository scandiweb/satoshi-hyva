export type ContactFormType = {
    isLoading: boolean;
    errors: number;
    hasCaptchaToken: number;
    displayErrorMessage: boolean | number;
    errorMessages: string[];

    setErrorMessages(messages: string): void;
    submitForm(): void;
};

export const ContactForm = (formId: string, recaptchaValidationCode: string) => {
    return <ContactFormType>{
        isLoading: false,
        errors: 0,
        hasCaptchaToken: 0,
        displayErrorMessage: false,
        errorMessages: [],
        setErrorMessages(messages) {
            this.errorMessages = [messages]
            this.displayErrorMessage = this.errorMessages.length
        },
        submitForm() {
            // Do not rename $form, the variable is expected to be declared in the recaptcha output
            const $form = document.querySelector(`#${formId}`) as HTMLFormElement;
            eval(recaptchaValidationCode);

            if (this.errors === 0) {
                const formData = new FormData($form);
                this.isLoading = true;

                fetch($form.action, {
                    method: "POST",
                    body: formData
                })
                    .then((result) => {
                        return result.text();
                    })
                    .then((content) => {
                        window.hyva.replaceDomElement('#contact', content);
                        this.isLoading = false;
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                        this.isLoading = false;
                    });
            }
        }
    }
}
