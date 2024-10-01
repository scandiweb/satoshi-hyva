export type NewsletterPropsType = {
    recaptchaValidationCode: string;
    isCaptchaEnabled: boolean;
    recaptchaSiteKey: string;
    recaptchaFormIdNewsletter: string;
    recaptchaType: string;
    recaptchaV2InvisibleBadgePosition: ReCaptchaV2.Badge;
    defaultErrorMessage: string;
};

export type NewsletterType = {
    isLoading: boolean;
    formSubmissionErrorMessages: Record<string, string>;
    formSubmissionSuccessMessage: string;
    errors: number;
    hasCaptchaToken: number;
    displayErrorMessage: boolean | number;
    errorMessages: string[];

    setErrorMessages(messages: string): void;
    clearMessages(): void;
    submitForm(): void;
    subscribe(formData: FormData): void;
};

export const Newsletter = ({
    recaptchaValidationCode,
    isCaptchaEnabled,
    recaptchaSiteKey,
    recaptchaFormIdNewsletter,
    recaptchaType,
    recaptchaV2InvisibleBadgePosition,
    defaultErrorMessage
}: NewsletterPropsType) => {
    return <NewsletterType>{
        isLoading: false,
        formSubmissionErrorMessages: {},
        formSubmissionSuccessMessage: '',
        errors: 0,
        hasCaptchaToken: 0,
        displayErrorMessage: false,
        errorMessages: [],
        setErrorMessages(messages) {
            this.errorMessages = [messages]
            this.displayErrorMessage = this.errorMessages.length
        },
        clearMessages() {
            this.formSubmissionErrorMessages = {};
            this.formSubmissionSuccessMessage = '';
            this.displayErrorMessage = false;
            this.errorMessages = [];
        },
        submitForm() {
            this.clearMessages();

            // Do not rename $form, the variable is expected to be declared in the recaptcha output
            const $form = document.querySelector('#newsletter-validate-detail') as HTMLFormElement;
            eval(recaptchaValidationCode);

            if (this.errors === 0) {
                const formData = new FormData($form);

                if (isCaptchaEnabled) {
                    // Recaptcha v3
                    if (recaptchaType === 'recaptcha_v3') {
                        grecaptcha.ready(() => {
                            grecaptcha.execute(recaptchaSiteKey, {action: recaptchaFormIdNewsletter})
                                .then((token) => {
                                    if (formData.has('g-recaptcha-response')) {
                                        formData.delete('g-recaptcha-response');
                                    }
                                    formData.append('g-recaptcha-response', token);
                                    this.subscribe(formData);
                                });
                        });
                    }
                    // Recaptcha v2 checkbox
                    else if (recaptchaType === 'recaptcha') {
                        const token = grecaptcha.getResponse(window.grecaptchaInstanceNewsletter);
                        if (formData.has('g-recaptcha-response')) {
                            formData.delete('g-recaptcha-response');
                        }
                        formData.append('g-recaptcha-response', token);
                        this.subscribe(formData);
                        grecaptcha.reset(window.grecaptchaInstanceNewsletter);
                    }
                    // Recaptcha v2 invisible
                    else if (recaptchaType === 'invisible') {
                        grecaptcha.execute(window.grecaptchaInstanceNewsletter).then(() => {
                            const token = grecaptcha.getResponse(window.grecaptchaInstanceNewsletter);

                            if (!token) {
                                return;
                            }

                            formData.set('g-recaptcha-response', token);
                            this.subscribe(formData);

                            const recaptchaElement = document.createElement('div');
                            const recaptchaElementId = 'grecaptcha-container-Newsletter';
                            recaptchaElement.id = recaptchaElementId;

                            const recaptchaContainer = document.getElementById('newsletter-recaptcha-container') as HTMLElement;
                            recaptchaContainer.innerHTML = '';
                            recaptchaContainer.appendChild(recaptchaElement);

                            // Re-render reCAPTCHA to have a new token for the next ajax call
                            window.grecaptchaInstanceNewsletter = grecaptcha.render(recaptchaElementId, {
                                sitekey: recaptchaSiteKey,
                                callback: window.googleRecaptchaCallbackNewsletter,
                                size: 'invisible',
                                badge: recaptchaV2InvisibleBadgePosition,
                            });
                        });
                    }
                } else {
                    this.subscribe(formData);
                }
            }
        },
        subscribe(formData) {
            const $form = document.querySelector('#newsletter-validate-detail') as HTMLFormElement;
            this.isLoading = true;

            fetch($form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.formSubmissionSuccessMessage = data.message;
                } else {
                    this.formSubmissionErrorMessages[data.field] = data.message;
                }
            })
            .catch(() => {
                this.formSubmissionErrorMessages['email'] = defaultErrorMessage;
            })
            .finally(() => {
                this.isLoading = false;
            });
        }
    }
}
