export type NewsletterType = {
  isLoading: boolean;
  successMessage: string;
  errorMessages: string[];
  errors: number;
  hasCaptchaToken: number;
  displayErrorMessage: boolean | number;

  setErrorMessages(messages: string[]): void;
  clearMessages(): void;
  submitForm(event: Event): void;
};

export const Newsletter = (defaultErrorMessage: string) => {
  return <NewsletterType>{
    isLoading: false,
    successMessage: "",
    errorMessages: [],
    errors: 0,
    hasCaptchaToken: 0,
    displayErrorMessage: false,
    setErrorMessages(messages) {
      this.errorMessages = messages;
      this.displayErrorMessage = !!this.errorMessages.length;
    },
    clearMessages() {
      this.successMessage = "";
      this.displayErrorMessage = false;
      this.errorMessages = [];
    },
    submitForm() {
      this.clearMessages();

      const $form = document.getElementById(
        "newsletter-validate-detail",
      ) as HTMLFormElement;
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
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            this.successMessage = data.message;
          } else {
            this.setErrorMessages([data.message]);
          }
        })
        .catch((_e) => {
          this.setErrorMessages([defaultErrorMessage]);
        })
        .finally(() => {
          this.isLoading = false;

          // Refresh recaptcha if existed
          // Because form here updates via ajax so recaptcha token gets expired after used once.
          try {
            window.grecaptcha?.reset();
          } catch (_e) {}
        });
    },
  };
};
