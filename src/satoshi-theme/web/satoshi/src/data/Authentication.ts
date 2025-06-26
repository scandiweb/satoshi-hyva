import { MainStoreType } from "../store/Main";
import {
  replaceMainContentWithTransition,
  navigateWithTransition,
} from "../plugins/Transition";

type RegisterProps = {
  telephoneErrorMessage: string;
  postCodes: {
    [countryId: string]: {
      pattern: string;
      example: string;
    }[];
  };
  postcodeWarnings: string[];
};

export type AuthenticationType = {
  initRegister(props: RegisterProps): void;
  updateCountry(data: any): void;
  changeCountry(
    countrySelectElement: HTMLSelectElement,
    initialRegion: string,
  ): void;
  setCountry(
    countrySelectElement: HTMLSelectElement,
    initialRegion: string,
  ): void;
  validateCountryDependentFields(): void;
  hasAvailableRegions(): boolean;
  isLoading: boolean;
  logout(postData: { action: string }): void;
  logoutSuccess(url: string): void;
} & MainStoreType;

export const Authentication = () => {
  return <AuthenticationType>{
    isLoading: false,

    initRegister({ telephoneErrorMessage, postCodes, postcodeWarnings }) {
      this.$nextTick(() => {
        window.hyva.formValidation.addRule(
          "telephone",
          (value: string, options: { minlength?: number }) => {
            const phoneNumber = value.trim().replace(" ", "");
            if (phoneNumber && phoneNumber.length < (options.minlength || 3)) {
              return telephoneErrorMessage;
            }
            return true;
          },
        );

        window.hyva.formValidation.addRule(
          "postcode",
          (
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
              fields: Record<string, any>;
              removeMessages: (field: any, type: string) => void;
              addMessages: (
                field: any,
                type: string,
                messages: string[],
              ) => void;
            },
          ) => {
            context.removeMessages(field, "postcode-warning");
            const countryId =
                context.fields["country_id"] &&
                context.fields["country_id"].element.value,
              validatedPostCodeExamples = [],
              countryPostCodeSpecs =
                countryId && postCodes ? postCodes[countryId] : false;

            if (!postCode || !countryPostCodeSpecs) return true;

            for (const postCodeSpec of Object.values(countryPostCodeSpecs)) {
              if (new RegExp(postCodeSpec.pattern).test(postCode)) return true;
              validatedPostCodeExamples.push(postCodeSpec.example);
            }
            if (validatedPostCodeExamples) {
              context.addMessages(field, "postcode-warning", [
                postcodeWarnings[0],
                postcodeWarnings[1] +
                  validatedPostCodeExamples.join("; ") +
                  ". ",
                postcodeWarnings[2],
              ]);
            }

            return true;
          },
        );
      });
    },

    updateCountry(data) {
      this.directoryData = data["directory-data"] || {};
      const countryElement = this.$refs["country_id"] as HTMLSelectElement;
      if (countryElement) {
        this.setCountry(countryElement, this.block?.getCountryId());
      }
    },

    changeCountry(countrySelectElement, initialRegion) {
      this.setCountry(countrySelectElement, initialRegion);
      this.validateCountryDependentFields();
    },

    setCountry(countrySelectElement, initialRegion) {
      const selectedOption =
        countrySelectElement.options[countrySelectElement.selectedIndex];
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
        (regionId) => this.availableRegions[regionId].name === initialRegion,
      )[0];
      this.selectedRegion = initialRegionId || "0";
      this.setRegionInputValue(
        (initialRegionId && this.availableRegions[initialRegionId].name) || "",
      );
    },

    validateCountryDependentFields() {
      this.$nextTick(() => {
        this.fields["postcode"] && this.removeMessages(this.fields["postcode"]);
        this.fields["region"] && this.removeMessages(this.fields["region"]);
        delete this.fields["postcode"];
        delete this.fields["region"];
        this.setupField(this.$refs["country_id"]);
        this.setupField(this.$refs["postcode"]);
        this.setupField(this.$refs["region"]);
        this.fields["postcode"] && this.validateField(this.fields["postcode"]);
        this.fields["region"] && this.validateField(this.fields["region"]);
      });
    },

    hasAvailableRegions() {
      return Object.keys(this.availableRegions).length > 0;
    },

    logout(postData) {
      if (this.isLoading) return;

      this.isLoading = true;

      // using postData.data causes 'Invalid Form Key' error
      const formData = new FormData();
      formData.append("form_key", window.hyva.getFormKey());
      formData.append("uenc", window.hyva.getUenc());

      fetch(postData.action, {
        method: "POST",
        body: formData,
      })
        .then((result) => {
          return result;
        })
        .then(async (response) => {
          await replaceMainContentWithTransition(
            response.url,
            await response.text()
          );
        })
        .catch((error) => {
          console.error("Error while logging out:", error);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },

    /**
     * Redirect after a success logout
     *
     * @param url
     */
    logoutSuccess(url) {
      const timeout = setTimeout(function () {
        navigateWithTransition(url);
      }, 5000);

      // Clear timeout if user navigated to other pages
      window.addEventListener(
        "pushstate",
        async () => {
          clearTimeout(timeout);
        },
        {
          once: true,
        }
      );
      window.addEventListener(
        "popstate",
        async () => {
          clearTimeout(timeout);
        },
        {
          once: true,
        }
      );
    },
  };
};
