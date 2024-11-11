import { MainStoreType } from "../store/Main";

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
} & MainStoreType;

export const Authentication = () => {
  return <AuthenticationType>{
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
  };
};
