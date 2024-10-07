import {Magics} from "alpinejs";
import {replaceMainContentWithTransition} from "../plugins/Transition";

export type AccountInformationType = {
  isLoading: boolean;
  showEmailField: boolean;
  showPasswordFields: boolean;
  errorMessages: string[];
  displayErrorMessage: boolean;
  errors: number;
  validate(): Promise<void>;
  handleCheckboxChange(checkboxId: string): void;
  setErrorMessages(messages: string[]): void;
  saveChanges(form: HTMLFormElement): void;
  submitForm(event: Event): void;
} & Magics<{}>;

export const AccountInformation = (
    initialShowPasswordFields: boolean,
    recaptchaValidationScript: string,
) =>
    <AccountInformationType>{
      isLoading: false,
      showEmailField: false,
      showPasswordFields: initialShowPasswordFields,
      errorMessages: [] as string[],
      displayErrorMessage: false,
      errors: 0,

      handleCheckboxChange(checkboxId) {
        if (checkboxId === 'email-fields') {
          this.showEmailField = !this.showEmailField;
        }
        if (checkboxId === 'password-fields') {
          this.showPasswordFields = !this.showPasswordFields;
        }

        this.$nextTick(() => {
          const firstFocusableElement = document.querySelector(`#${checkboxId} input, #${checkboxId} textarea, #${checkboxId} select`) as HTMLElement;
          if (firstFocusableElement) {
            firstFocusableElement.focus();
          }
        });
      },

      setErrorMessages(messages: string[]) {
        this.errorMessages = messages;
        this.displayErrorMessage = messages.length > 0;
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

      submitForm(event) {
        this.validate()
            .then(() => {
              // Do not rename $form, the variable is expected to be declared in the recaptcha output
              const $form = event.target as HTMLFormElement;

              if (recaptchaValidationScript) {
                eval(recaptchaValidationScript);
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
