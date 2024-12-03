import type {Magics} from "alpinejs";

type Rating = {
  rating_id: string;
  entity_id: string;
  rating_code: string;
  position: string;
  is_active: string;
  entity_code: string;
};

type ReviewFormProps = {
  ratings: Rating[];
  messages: Record<string, string>;
  gqlQuery: string;
  sku: string;
  fieldName: string;
  formId: string;
  storeCode: string;
};

export type ReviewFormType = {
  isLoading: boolean;
  displayNickname: boolean;
  displaySuccessMessage: boolean;
  displayErrorMessage: boolean;
  errorMessages: Array<string[]> | [];
  errors: number;
  hasCaptchaToken: number;
  nickname: string | null;
  summary: string | null;
  ratings: any;
  review: string | null;
  setErrorMessages(messages: string[]): void;
  submitForm(): void;
  validate(): void;
  placeReview(): void;
} & Magics<{}>;

export const ReviewForm = ({
                             ratings,
                             messages,
                             gqlQuery,
                             sku,
                             fieldName,
                             formId,
                             storeCode,
                           }: ReviewFormProps) =>
  <ReviewFormType>{
    isLoading: false,
    displayNickname: false,
    displaySuccessMessage: false,
    displayErrorMessage: false,
    errorMessages: [],
    errors: 0,
    hasCaptchaToken: 0,
    nickname: null,
    summary: null,
    ratings: [],
    review: null,
    setErrorMessages: function (messages) {
      this.errorMessages = [messages];
      console.log("errorMessages", this.errorMessages);
      this.displayErrorMessage = !!this.errorMessages.length;
    },

    validate: function () {
      console.log('validate');
      this.nickname = (
        document.getElementById("nickname_field") as HTMLInputElement
      ).value;
      this.summary = (
        document.getElementById("summary_field") as HTMLInputElement
      ).value;
      this.review = (
        document.getElementById("review_field") as HTMLInputElement
      ).value;

      let ratingValue;
      ratings.forEach((rating) => {
        try {
          const rating_id = rating.rating_id;
          ratingValue = (
            document.querySelector(
              `input[name="ratings[${rating_id}]"]:checked`,
            ) as HTMLInputElement
          ).value;
          this.ratings[rating_id] = btoa(ratingValue);
        } catch (e) {
          console.log(e);
        }
      });

      if (
        !(
          this.nickname &&
          this.summary &&
          this.review &&
          Object.keys(this.ratings).length === ratings.length
        )
      ) {
        this.setErrorMessages([messages.required]);
        this.displayErrorMessage = true;
        this.errors = 1;
        this.hasCaptchaToken = 0;
      }
    },
    placeReview: function () {
      this.isLoading = true;
      this.displayErrorMessage = false;

      const query = gqlQuery;
      const variables = {
        sku,
        nick: this.nickname,
        summary: this.summary,
        review: this.review,
        ratings: Object.keys(this.ratings).map((key) => {
          return { id: btoa(key), value_id: this.ratings[key] };
        }),
      };

      const form = document.querySelector(`#${formId}`) as HTMLFormElement;
      const elements = form.elements as Record<string, any>;

      const recaptchaHeader =
        fieldName && form && elements[fieldName]
          ? { "X-ReCaptcha": elements[fieldName].value }
          : {};

      fetch(`${BASE_URL}graphql`, {
        method: "POST",
        headers: Object.assign(
          {
            "Content-Type": "application/json;charset=utf-8",
            Store: storeCode,
          },
          recaptchaHeader,
        ),
        credentials: "include",
        body: JSON.stringify({ query: query, variables: variables }),
      })
        .then((response) => response.json())
        .then((data) => {
          this.isLoading = false;
          if (data.errors) {
            this.setErrorMessages([messages.failed]);
            this.displayErrorMessage = true;
          } else {
            this.displaySuccessMessage = true;
          }
        });
    },
  };
