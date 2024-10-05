import type {Magics} from 'alpinejs';

interface PostCodeSpec {
  pattern: string;
  example: string;
}

interface CountryPostCodeSpecs {
  [countryId: string]: PostCodeSpec[];
}

export type AddressEditType = {
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
  setCountry(countrySelectElement: HTMLSelectElement, initialRegion: string): void;
  setRegionInputValue(regionName: string): void;
  changeCountry(event: Event, initialRegion: string): void;
  validateCountryDependentFields(): void;
  hasAvailableRegions(): boolean;
  onRegionIdChange(event: Event): void;
  submitForm(cb: Function): void;
  validate(): Promise<void>;
  setupField(field: HTMLElement): void;
  validateField(field: any): void;
  removeMessages(field: any): void;
  onChange(event: Event): void;
} & Magics<{}>;

export const AddressEdit = (
    showOptionalRegions: boolean,
    telephoneErrorMessage: string,
    postCodeSpecs: CountryPostCodeSpecs,
    postcodeWarnings: string[],
) =>
    <AddressEditType>{
      directoryData: {},
      availableRegions: {},
      messageTime: 5000,
      fieldsNames: [] as string[],
      selectedRegion: '0',
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
      setCountry(this: AddressEditType, countrySelectElement: HTMLSelectElement, initialRegion: string) {
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
        this.setRegionInputValue(initialRegionId ? this.availableRegions[initialRegionId].name : '');
      },

      setRegionInputValue(this: AddressEditType, regionName: string) {
        this.$nextTick(() => {
          const regionInputElement = this.$refs['region'] as HTMLInputElement;
          if (regionInputElement) {
            regionInputElement.value = regionName;
          }
        });
      },

      changeCountry(this: AddressEditType, event: Event, initialRegion: string) {
        this.setCountry(event.target as HTMLSelectElement, initialRegion);
        this.validateCountryDependentFields();
        this.onChange(event);
      },

      validateCountryDependentFields(this: AddressEditType) {
        this.$nextTick(() => {
          if (this.fields['postcode']) this.removeMessages(this.fields['postcode']);
          if (this.fields['region']) this.removeMessages(this.fields['region']);
          delete this.fields['postcode'];
          delete this.fields['region'];

          this.setupField(this.$refs['country_id'] as HTMLElement);
          this.setupField(this.$refs['postcode'] as HTMLElement);
          this.setupField(this.$refs['region'] as HTMLElement);
          this.setupField(this.$refs['region_id'] as HTMLElement);

          if (this.fields['postcode']) this.validateField(this.fields['postcode']);
          if (this.fields['region']) this.validateField(this.fields['region']);
          if (this.fields['region_id']) this.validateField(this.fields['region_id']);
        });
      },

      hasAvailableRegions(this: AddressEditType) {
        return Object.keys(this.availableRegions).length > 0;
      },

      onRegionIdChange(this: AddressEditType, event: Event) {
        const regionInput = this.$refs['region'] as HTMLInputElement;
        regionInput.value =
            this.selectedRegion.length > 0 ? this.availableRegions[this.selectedRegion].name : '';
        this.onChange(event);
        this.validateField(this.fields['region']);
      },

      submitForm(this: AddressEditType, cb: Function) {
        this.validate()
            .then(() => {
              const invalidFields = Object.values(this.fields).filter((field) => !field.state.valid);
              if (invalidFields.length === 0) {
                cb();
              }
            })
            .catch((invalid) => {
              if (invalid.length > 0) {
                (invalid[0] as HTMLElement).focus();
              }
            });
      },
    };
