import { replaceMainContentWithTransition } from "../plugins/Transition";
import { MainStoreType } from "../store/Main";

export type AuthenticationType = {
  isLoading: boolean;
  errors: number;
  hasCaptchaToken: boolean;
  displayErrorMessage: boolean;
  errorMessages: any;
  generalErrorMessage: string;

  init(): void;
  setErrorMessages(messages: Record<string, string>): void;
  submitForm(event: Event, formId: string): void;
  submitForm(event: Event): void;
} & MainStoreType;

export const Authentication = () => {
  return <AuthenticationType>{
    isLoading: false,
    errors: 0,
    hasCaptchaToken: true,
    displayErrorMessage: false,
    errorMessages: [],

    setErrorMessages(messages) {
      this.errorMessages = messages;
      this.displayErrorMessage = this.errorMessages.length;
    },

    submitForm(event) {
      const $form = event.target as HTMLFormElement;
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
