import { Magics } from "alpinejs";
import { navigateWithTransition } from "../plugins/Transition";

interface PostCodeSpec {
  pattern: string;
  example: string;
}

interface CountryPostCodeSpecs {
  [countryId: string]: PostCodeSpec[];
}

export type RegisterType = {
  isLoading: boolean;
  errors: number;
  showPassword: boolean;
  showPasswordConfirm: boolean;
  recaptchaErrorMessage?: string;

  init(): void;
  onPrivateContentLoaded(data: any): void;
  changeCountry(
      countrySelectElement: HTMLSelectElement,
      initialRegion: string
  ): void;
  setCountry(
      countrySelectElement: HTMLSelectElement,
      initialRegion: string
  ): void;
  validateCountryDependentFields(): void;
  hasAvailableRegions(): boolean;
  onRegister(form: HTMLFormElement): void;
  submitForm(event: Event): void;
  validateRecaptcha(form: HTMLFormElement): void;
  [key: string]: any;
} & Magics<{}>;

export const Register = (
    recaptchaValidationScript: Function,
    telephoneErrorMessage: string,
    postCodeSpecs: CountryPostCodeSpecs,
    postcodeWarnings: string[],
) =>
    <RegisterType>{
      isLoading: false,
      errors: 0,
      showPassword: false,
      showPasswordConfirm: false,
      recaptchaErrorMessage: undefined,

      init() {
        this.$nextTick(() => {
          window.hyva.formValidation.addRule('telephone', (value: string, options: { minlength?: number }) => {
            const phoneNumber = value.trim().replace(' ', '');
            if (phoneNumber && phoneNumber.length < (options.minlength || 3)) {
              return telephoneErrorMessage;
            }
            return true;
          });

          window.hyva.formValidation.addRule('postcode', (
              postCode: string,
              _options: boolean,
              field: {
                element: HTMLInputElement;
                rules: Record<string, any>;
                validateOnChange: boolean;
                state: {
                  valid: boolean;
                  messages: string[];
                };
              },
              context: {
                fields: Record<string, any>,
                removeMessages: (field: any, type: string) => void,
                addMessages: (field: any, type: string, messages: string[]) => void
              }) => {
            context.removeMessages(field, 'postcode-warning')
            const countryId = (context.fields['country_id'] && context.fields['country_id'].element.value),
                validatedPostCodeExamples = [],
                countryPostCodeSpecs = countryId && postCodeSpecs ? postCodeSpecs[countryId] : false;

            if (!postCode || !countryPostCodeSpecs) return true;

            for (const postCodeSpec of Object.values(countryPostCodeSpecs)) {
              if (new RegExp(postCodeSpec.pattern).test(postCode)) return true;
              validatedPostCodeExamples.push(postCodeSpec.example);
            }
            if (validatedPostCodeExamples) {
              context.addMessages(field, 'postcode-warning', [
                postcodeWarnings[0],
                postcodeWarnings[1] + validatedPostCodeExamples.join('; ') + '. ',
                postcodeWarnings[2]
              ]);
            }

            return true;
          });
        });
      },

      onPrivateContentLoaded(data) {
        this.directoryData = data["directory-data"] || {};
        const countryElement = this.$refs["country_id"] as HTMLSelectElement;
        if (countryElement) {
          this.setCountry(countryElement, this.block.getCountryId());
        }
      },

      setCountry(countrySelectElement, initialRegion) {
        const selectedOption = countrySelectElement.options[countrySelectElement.selectedIndex];
        const countryCode = countrySelectElement.value;
        const countryData = this.directoryData[countryCode] || false;

        if (!countryData) {
          this.setRegionInputValue("");
          return;
        }

        this.isZipRequired = selectedOption.dataset.isZipRequired === "1";
        this.isRegionRequired = selectedOption.dataset.isRegionRequired === "1";
        this.availableRegions = countryData.regions || {};

        const initialRegionId = Object.keys(this.availableRegions).filter(
            (regionId) => this.availableRegions[regionId].name === initialRegion
        )[0];
        this.selectedRegion = initialRegionId || "0";
        this.setRegionInputValue((initialRegionId && this.availableRegions[initialRegionId].name) || "");
      },

      changeCountry(countrySelectElement, initialRegion) {
        this.setCountry(countrySelectElement, initialRegion);
        this.validateCountryDependentFields();
      },

      validateCountryDependentFields() {
        this.$nextTick(() => {
          this.fields["postcode"] &&
          this.removeMessages(this.fields["postcode"]);
          this.fields["region"] &&
          this.removeMessages(this.fields["region"]);
          delete this.fields["postcode"];
          delete this.fields["region"];
          this.setupField(this.$refs["country_id"]);
          this.setupField(this.$refs["postcode"]);
          this.setupField(this.$refs["region"]);
          this.fields["postcode"] &&
          this.validateField(this.fields["postcode"]);
          this.fields["region"] &&
          this.validateField(this.fields["region"]);
        });
      },

      hasAvailableRegions() {
        return Object.keys(this.availableRegions).length > 0;
      },

      onRegister($form) {
        if (!$form) return;

        const formData = new FormData($form);
        this.isLoading = true;

        fetch($form.action, {
          method: "POST",
          body: formData,
        })
            .then(async (res) => {
              if (res.ok) {
                if (res.url === window.location.href) {
                  window.hyva.replaceDomElement("#form-validate", await res.text());
                  return;
                }

                navigateWithTransition(res.url);
              }
            })
            .catch((error) => {
              console.error("Error while registering account:", error);
              location.reload();
            })
            .finally(() => {
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
                this.onRegister($form);
              }
            })
            .catch((invalid: HTMLElement[]) => {
              if (invalid.length > 0) {
                (invalid[0]).focus();
              }
            });
      },
    };
