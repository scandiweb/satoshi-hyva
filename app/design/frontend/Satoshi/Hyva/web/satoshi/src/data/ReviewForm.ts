import nProgress from "nprogress";

nProgress.configure({ showSpinner: false });

export function ReviewForm(props: {
    formId: string;
    ratingsCount: number;
    sku: string;
    storeCode: string;
    gqlCreateProductReviewMutation: string;
    recaptchaFieldName: string | null;
}) {
    return {
        displaySuccessMessage: false,
        displayErrorMessage: false,
        errorMessages: [] as string[],
        errors: 0,
        ratings: {} as Record<number, string>,
        nickname: '',
        summary: '',
        review: '',
        setErrorMessages(messages: string[]) {
            this.errorMessages = messages;
            this.displayErrorMessage = !!messages.length;
        },
        submitForm() {
            const form = document.querySelector(`#${props.formId}`) as HTMLFormElement;

            this.validate();

            if (this.errors === 0) {
                this.placeReview();
            }
        },
        validate() {
            this.nickname = (document.getElementById('nickname_field') as HTMLInputElement).value;
            this.summary = (document.getElementById('summary_field') as HTMLInputElement).value;
            this.review = (document.getElementById('review_field') as HTMLInputElement).value;

            let ratingValue: string | null = null;

            [...document.querySelectorAll('input[name^="ratings"]')].forEach(input => {
                const radioInput = input as HTMLInputElement;
                if (radioInput.checked) {
                    this.ratings[parseInt(radioInput.name.replace('ratings[', '').replace(']', ''))] = btoa(radioInput.value);
                }
            });

            if (!(this.nickname && this.summary && this.review && Object.keys(this.ratings).length === props.ratingsCount)) {
                this.setErrorMessages(['Please verify you\'ve entered all required information']);
                this.errors = 1;
            } else {
                this.errors = 0;
            }
        },
        async placeReview() {
            nProgress.start();
            this.displayErrorMessage = false;

            const variables = {
                sku: props.sku,
                nick: this.nickname,
                summary: this.summary,
                review: this.review,
                ratings: Object.keys(this.ratings).map(key => ({
                    id: btoa(key),
                    value_id: this.ratings[parseInt(key)]
                })),
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json;charset=utf-8',
                'Store': props.storeCode,
            };

            if (props.recaptchaFieldName) {
                const form = document.querySelector(`#${props.formId}`) as HTMLFormElement;
                headers['X-ReCaptcha'] = (form.elements[props.recaptchaFieldName] as HTMLInputElement)?.value || '';
            }

            try {
                const response = await fetch(`${BASE_URL}graphql`, {
                    method: 'POST',
                    headers,
                    credentials: 'include',
                    body: JSON.stringify({
                        query: props.gqlCreateProductReviewMutation,
                        variables
                    })
                });
                const data = await response.json();

                if (data.errors) {
                    this.setErrorMessages(['Submitting your review failed, please try again.']);
                } else {
                    this.displaySuccessMessage = true;
                }
            } catch (error) {
                this.setErrorMessages(['An error occurred while submitting your review. Please try again.']);
            } finally {
                nProgress.done();
            }
        }
    }
}
