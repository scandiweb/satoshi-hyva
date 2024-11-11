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

export const Form = (formId: string) => {
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
    submitForm() {
      const $form = document.getElementById(formId) as HTMLFormElement;
      if (!$form) return;

      const formData = new FormData($form);
      this.isLoading = true;

      fetch($form.action, {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
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
