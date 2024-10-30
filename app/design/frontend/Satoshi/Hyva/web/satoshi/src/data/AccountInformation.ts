import { Magics } from "alpinejs";
import { replaceMainContentWithTransition } from "../plugins/Transition";

export type AccountInformationType = {
  isLoading: boolean;
  showEmailField: boolean;
  showPasswordFields: boolean;
  errorMessages: string[];
  displayErrorMessage: boolean;
  errors: number;
  recaptchaErrorMessage: string | null;
  isCaptchaEnabled: boolean;
  recaptchaType: string;
  recaptchaFailedMessage: string;
  recaptchaSystemErrorMessage: string;
  validate(): Promise<void>;
  handleCheckboxChange(checkboxId: string): void;
  setErrorMessages(messages: string[]): void;
  saveChanges(form: HTMLFormElement): void;
  submitForm(event: Event): void;
  validateRecaptcha(form: HTMLFormElement): void;
} & Magics<{}>;

export const AccountInformation = (
    recaptchaValidationScript: Function,
    isCaptchaEnabled: boolean,
    recaptchaType: string,
    recaptchaFailedMessage: string,
    recaptchaSystemErrorMessage: string,
    initialShowEmailField: boolean,
    initialShowPasswordFields: boolean,
) =>
    <AccountInformationType>{
      isLoading: false,
      showEmailField: initialShowEmailField || false,
      showPasswordFields: initialShowPasswordFields || false,
      errorMessages: [] as string[],
      displayErrorMessage: false,
      errors: 0,
      recaptchaErrorMessage: null,

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

              this.validateRecaptcha($form);

              if (this.errors === 0 && !this.recaptchaErrorMessage) {
                this.saveChanges($form);
              }
            })
            .catch((invalid) => {
              if (invalid.length > 0) {
                (invalid[0] as HTMLElement).focus();
              }
            });
      },

      validateRecaptcha($form) {
        this.recaptchaErrorMessage = null;

        if (isCaptchaEnabled) {
          try {
            // Execute the recaptcha validation script to initialize the validation process
            recaptchaValidationScript();

            // Obtain the reCAPTCHA response token based on type
            let recaptchaToken = '';

            if (recaptchaType === 'recaptcha_v3') {
              // For v3, reCAPTCHA will execute and provide the token directly
              recaptchaToken = grecaptcha.getResponse();
            } else if (recaptchaType === 'recaptcha' || recaptchaType === 'invisible') {
              // For v2 types, get the token from the specific reCAPTCHA instance
              recaptchaToken = grecaptcha.getResponse(window.grecaptchaInstanceCustomercreate);
            }

            if (!recaptchaToken) {
              this.recaptchaErrorMessage = recaptchaFailedMessage;
              return;
            }

            // Append the token to the form data based on reCAPTCHA type
            if (recaptchaType === 'recaptcha_v3' || recaptchaType === 'recaptcha') {
              $form['g-recaptcha-response'].value = recaptchaToken;
            } else if (recaptchaType === 'invisible') {
              // Execute the invisible captcha explicitly and append the token after
              grecaptcha.execute(window.grecaptchaInstanceCustomercreate).then(() => {
                $form['g-recaptcha-response'].value = recaptchaToken;
              });
            }
          } catch (error) {
            this.recaptchaErrorMessage = recaptchaSystemErrorMessage;
          }
        }
      },
    };
