import { replaceMainContentWithTransition } from "../plugins/Transition";

export type FormType = {
  isLoading: boolean;
  errors: number;
  hasCaptchaToken: number;
  displayErrorMessage: boolean | number;
  errorMessages: string[];

  setErrorMessages(messages: string[]): void;
  submitForm(event: Event): void;
};

export const Form = () => {
  return <FormType>{
    isLoading: false,
    errors: 0,
    hasCaptchaToken: 0,
    displayErrorMessage: false,
    errorMessages: [],
    setErrorMessages(messages) {
      this.errorMessages = messages;
      this.displayErrorMessage = !!this.errorMessages.length;
    },
    submitForm(event) {
      const $form = event.target as HTMLFormElement;
      const formData = new FormData($form);
      this.isLoading = true;

      const isGetMethod = $form.method.toLowerCase() === "get";
      const query = isGetMethod ? new URLSearchParams(formData as any).toString() : '';
      const formAction = $form.action + `?${query}`;

      fetch(formAction, {
        method: $form.method,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
        ...(isGetMethod ? {} : {body: formData})
      })
        .then((response) => {
          return response.text().then(async (content) => {
            await replaceMainContentWithTransition(response.url, content);
          });
        })
        .catch((error) => {
          console.error("Form submission failed:", error);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
  };
};
