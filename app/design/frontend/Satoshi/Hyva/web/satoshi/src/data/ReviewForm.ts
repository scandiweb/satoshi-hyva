import nProgress from "nprogress";

nProgress.configure({showSpinner: false});

export function ReviewForm(props: {
    formId: string;
    sku: string;
    storeCode: string;
    gqlCreateProductReviewMutation: string;
    recaptchaFieldName: string | null;
    ratings: { rating_id: number }[],
    recaptchaValidation: string,
}) {
    return {
        displaySuccessMessage: false,
        displayErrorMessage: false,
        errorMessages: [] as string[],
        errors: false,
        ratings: [],
        nickname: '',
        summary: '',
        review: '',
        setErrorMessages(messages: string[]) {
            this.errorMessages = messages;
            this.displayErrorMessage = !!messages.length;
        },
        submitForm() {
            const $form = document.querySelector(`#${props.formId}`) as HTMLFormElement;

            this.validate();

            eval(props.recaptchaValidation);

            if (!this.errors) {
                this.placeReview();
            }
        },
        validate() {
            this.nickname = (document.getElementById('nickname_field') as HTMLInputElement).value;
            this.summary = (document.getElementById('summary_field') as HTMLInputElement).value;
            this.review = (document.getElementById('review_field') as HTMLInputElement).value;
            let ratingValue;
            props.ratings.forEach((rating) => {
                try {
                    ratingValue =
                        document
                            .querySelector(`input[name="ratings[${rating['rating_id']}]"]:checked`)
                            .value;
                    this.ratings[rating['rating_id']] = btoa(ratingValue);

                } catch (e) {
                    this.setErrorMessages(e.message);
                }
            });

            if (!(this.nickname &&
                this.summary &&
                this.review &&
                Object.keys(this.ratings).length === props.ratings.length
            )) {
                this.setErrorMessages(
                    ['Please verify you\'ve entered all required information']
                );
                this.errors = 1;
            }
        },
        async placeReview() {
            nProgress.start();
            this.displayErrorMessage = false;

            const query = props.gqlCreateProductReviewMutation;

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

            const form = document.querySelector(props.formId);

            const fieldName = props.recaptchaFieldName;
            const recaptchaHeader = fieldName && form && form.elements[fieldName]
                ? {'X-ReCaptcha': form.elements[fieldName].value}
                : {};


            try {
                const response = await fetch(`${BASE_URL}graphql`, {
                    method: 'POST',
                    headers: Object.assign({
                        'Content-Type': 'application/json;charset=utf-8',
                        'Store': props.storeCode
                    }, recaptchaHeader),
                    credentials: 'include',
                    body: JSON.stringify({
                        query,
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
