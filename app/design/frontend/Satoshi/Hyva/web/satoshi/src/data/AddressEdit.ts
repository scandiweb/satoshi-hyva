import type { Magics } from 'alpinejs';
import { replaceMainContentWithTransition } from "../plugins/Transition.ts";

interface PostCodeSpec {
  pattern: string;
  example: string;
}

interface CountryPostCodeSpecs {
  [countryId: string]: PostCodeSpec[];
}

export type AddressEditType = {
  isLoading: boolean;
  directoryData: Record<string, any>;
  availableRegions: Record<string, any>;
  messageTime: number;
  fieldsNames: string[];
  selectedRegion: string;
  isZipRequired: boolean;
  isRegionRequired: boolean;
  showOptionalRegions: boolean;
  fields: Record<string, any>;
  postCodeSpecs: CountryPostCodeSpecs;

  init(): void;
  onPrivateContentLoaded(data: Record<string, any>): void;
  setCountry(countrySelectElement: HTMLSelectElement, initialRegion: string): void;
  setRegionInputValue(regionName: string): void;
  changeCountry(event: Event, initialRegion: string): void;
  validateCountryDependentFields(): void;
  hasAvailableRegions(): boolean;
  onRegionIdChange(event: Event): void;
  validate(): Promise<void>;
  setupField(field: HTMLElement): void;
  validateField(field: any): void;
  removeMessages(field: any): void;
  onChange(event: Event): void;
  createOrUpdateAddress(event: Event): void;
  submitForm(event: Event): void;
} & Magics<{}>;

export const AddressEdit = (
    showOptionalRegions: boolean,
    countryId: string,
    region: string,
    selectedRegion: string,
    telephoneErrorMessage: string,
    postCodeSpecs: CountryPostCodeSpecs,
    postcodeWarnings: string[],
) =>
    <AddressEditType>{
      isLoading: false,
      directoryData: {},
      availableRegions: {},
      messageTime: 5000,
      fieldsNames: [] as string[],
      selectedRegion: selectedRegion,
      isZipRequired: true,
      isRegionRequired: true,
      showOptionalRegions: showOptionalRegions,
      fields: {},

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
        this.directoryData = data['directory-data'] || {};

        if (countryId) {
          this.setCountry(this.$refs['country_id'] as HTMLSelectElement, region);
        }
      },

      setRegionInputValue(regionName: string) {
        this.$nextTick(() => {
          const regionInputElement = this.$refs['region'] as HTMLInputElement;
          if (regionInputElement) {
            regionInputElement.value = regionName;
          }
        });
      },

      setCountry(countrySelectElement: HTMLSelectElement, initialRegion: string) {
        const selectedOption = countrySelectElement.options[countrySelectElement.selectedIndex];
        const countryCode = countrySelectElement.value;
        const countryData = this.directoryData[countryCode] || false;

        if (!countryData) {
          this.setRegionInputValue('');
          return;
        }

        this.isZipRequired = selectedOption.dataset.isZipRequired === '1';
        this.isRegionRequired = selectedOption.dataset.isRegionRequired === '1';
        this.availableRegions = countryData.regions || {};

        const initialRegionId = Object.keys(this.availableRegions).find(
            (regionId) => this.availableRegions[regionId].name === initialRegion
        );
        this.selectedRegion = initialRegionId || '0';
        this.setRegionInputValue(initialRegionId && this.availableRegions[initialRegionId].name || '');
      },

      changeCountry(event: Event, initialRegion: string) {
        this.setCountry(event.target as HTMLSelectElement, initialRegion);
        this.validateCountryDependentFields();
        this.onChange(event);
      },

      validateCountryDependentFields() {
        this.$nextTick(() => {
          this.fields['postcode'] && this.removeMessages(this.fields['postcode']);
          this.fields['region'] && this.removeMessages(this.fields['region']);
          delete this.fields['postcode'];
          delete this.fields['region'];

          this.setupField(this.$refs['country_id']);
          this.setupField(this.$refs['postcode']);
          this.setupField(this.$refs['region']);
          this.setupField(this.$refs['region_id']);

          if (this.fields['postcode']) this.validateField(this.fields['postcode']);
          if (this.fields['region']) this.validateField(this.fields['region']);
          if (this.fields['region_id']) this.validateField(this.fields['region_id']);
        });
      },

      hasAvailableRegions() {
        return Object.keys(this.availableRegions).length > 0;
      },

      onRegionIdChange(event: Event) {
        const regionInput = this.$refs['region'] as HTMLInputElement;
        if (regionInput) {
          regionInput.value = this.selectedRegion.length > 0 ?
              this.availableRegions[this.selectedRegion].name || '' :
              '';
        }
        this.onChange(event);
        this.validateField(this.fields['region']);
      },

      createOrUpdateAddress(event) {
        const $form = event.target as HTMLFormElement;
        if (!$form) return;

        this.isLoading = true;
        const formData = new FormData($form);

        fetch($form.action, {
          method: "POST",
          body: formData,
        })
            .then(async (res) => {
              if (res.ok) {
                await replaceMainContentWithTransition(res.url, await res.text());
              }
            })
            .catch((error) => {
              console.error("Error while creating or updating address:", error);
              location.reload();
            })
            .finally(() => {
              this.isLoading = false;
            });
      },

      submitForm(event) {
        this.validate()
            .then(() => {
              const invalidFields = Object.values(this.fields).filter((field) => !field.state.valid);
              if (invalidFields.length === 0) {
                this.createOrUpdateAddress(event);
              }
            })
            .catch((invalid: HTMLElement[]) => {
              if (invalid.length > 0) {
                (invalid[0]).focus();
              }
            });
      },
    };
