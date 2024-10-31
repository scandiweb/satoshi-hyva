import { Magics } from "alpinejs";
import { replaceMainContentWithTransition } from "../plugins/Transition";

export type AccountInformationType = {
  isLoading: boolean;
  showEmailField: boolean;
  showPasswordFields: boolean;
  errorMessages: string[];
  errors: number;
  recaptchaErrorMessage?: string;
  validate(): Promise<void>;
  handleCheckboxChange(checkboxId: string): void;
  setErrorMessages(messages: string[]): void;
  saveChanges(form: HTMLFormElement): void;
  validateRecaptcha(form: HTMLFormElement): void;
  submitForm(event: Event): void;
} & Magics<{}>;

export const AccountInformation = (
    recaptchaValidationScript: Function,
    initialShowEmailField: boolean,
    initialShowPasswordFields: boolean,
) =>
    <AccountInformationType>{
      isLoading: false,
      showEmailField: initialShowEmailField || false,
      showPasswordFields: initialShowPasswordFields || false,
      errorMessages: [] as string[],
      errors: 0,
      recaptchaErrorMessage: undefined,

      handleCheckboxChange(checkboxId) {
        this.$nextTick(() => {
          const firstFocusableElement = document.querySelector(`#${checkboxId} input, #${checkboxId} textarea, #${checkboxId} select`) as HTMLElement;
          if (firstFocusableElement) {
            firstFocusableElement.focus();
          }
        });
      },

      setErrorMessages(messages: string[]) {
        this.errorMessages = messages;
      },

      saveChanges($form) {
        if (!$form) return;

        const formData = new FormData($form);
        this.isLoading = true;

        fetch($form.action, {
          method: "POST",
          body: formData,
        }).then(async (res) => {
          if (res.ok) {
            await replaceMainContentWithTransition(res.url, await res.text());
          }
        }).catch((error) => {
          console.error("Error while updating account information:", error);
          location.reload();
        }).finally(() => {
          this.isLoading = false;
        });
      },

      validateRecaptcha(form: HTMLFormElement) {
        recaptchaValidationScript();
        const {errors, errorMessage} = window.validateRecaptchaToken(form);

        this.errors = errors ? errors : 0;
        this.recaptchaErrorMessage = errors ? errorMessage : undefined;
      },

      submitForm(event) {
        this.validate()
            .then(() => {
              const $form = event.target as HTMLFormElement;

              if (recaptchaValidationScript) {
                this.validateRecaptcha($form);
              }

              if (this.errors === 0) {
                this.saveChanges($form);
              }
            })
            .catch((invalid) => {
              if (invalid.length > 0) {
                (invalid[0] as HTMLElement).focus();
              }
            });
      },
    };
