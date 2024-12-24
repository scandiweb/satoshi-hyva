import type { Magics } from "alpinejs";
import { fetchShippingMethodsUrl, fetchTotalsUrl } from "../utils/magento-api";

export type Data = {
  cart: any;
  customer: any;
  "directory-data": any;
  "cart-data": any;
  "checkout-data": any;
};

export type Country = {
  id: string;
  name: string;
};

export type ShippingMethod = {
  amount: number;
  available: boolean;
  base_amount: number;
  carrier_code: string;
  carrier_title: string;
  error_message: string;
  method_code: string;
  method_title: string;
  price_excl_tax: number;
  price_incl_tax: number;
};

export type Region = {
  id: string;
  code: string;
  name: string;
};

export type ShippingType = {
  [key: string | symbol]: any;
  cart: any;
  customer: any;
  directoryData: any;
  cartData: any;
  checkoutData: any;
  shippingMethod: string | false;
  availableShippingMethods: ShippingMethod[] | [];
  showEstimateShipping: boolean;
  abortController: AbortController | null;

  init(): void;
  receiveCustomerData: (data: Data) => void;
  getSortedCountries: () => Country[];
  populateCartData: () => void;
  setCountry: (countryId: string) => void;
  saveToCustomerSectionData: () => void;
  fetchShippingMethods: () => void;
  hasAvailableRegions: () => boolean;
  getAvailableRegions: () => Region[];
  setRegion: (value: string, type: string) => void;
  fetchTotals: () => void;
  getEstimatedShippingRateCarriers: () => string[];
  getRatesForCarrier: (carrierTitle: string) => ShippingMethod[];
  updateShippingMethod: () => void;
  setPostcode: (value: string) => void;
  toggleEstimateShipping: () => void;
} & Magics<{}>;

export const Shipping = () =>
  <ShippingType>{
    cart: {},
    customer: {},
    directoryData: {},
    cartData: {},
    checkoutData: {},
    shippingMethod: false,
    showEstimateShipping: false,
    abortController: null,
    availableShippingMethods: [],

    init() {
      const selectedShippingMethod =
        Alpine.store("cart").cartTotals.selected_shipping_method;
      if (selectedShippingMethod) {
        this.shippingMethod = `${selectedShippingMethod.carrier_code}_${selectedShippingMethod.method_code}`;
      }

      this.showEstimateShipping = JSON.parse(
        window.hyva.getBrowserStorage().getItem("hyva.showEstimateShipping"),
      );

      Alpine.nextTick(() => {
        if (this.showEstimateShipping) {
          this.fetchShippingMethods();
        }
      });
    },

    receiveCustomerData(data: Data) {
      if (data.cart) {
        this.cart = data.cart;
        if (data.cart.cartTotals) {
          const selectedShippingMethod = data.cart.cartTotals.selected_shipping_method;
          if (selectedShippingMethod) {
            this.shippingMethod = `${selectedShippingMethod.carrier_code}_${selectedShippingMethod.method_code}`;
          } else {
            this.shippingMethod = false;
          }
        }
      }
      if (data.customer) {
        this.customer = data.customer;
      }
      if (data["directory-data"]) {
        this.directoryData = data["directory-data"];
      }
      if (data["cart-data"]) {
        this.cartData = data["cart-data"];
      }
      if (data["checkout-data"]) {
        this.checkoutData = data["checkout-data"];
        this.populateCartData();
      }
    },

    populateCartData() {
      const checkoutAddress =
        (this.checkoutData && this.checkoutData.shippingAddressFromData) || {};

      if (Object.keys(checkoutAddress).length) {
        if (
          checkoutAddress["country_id"] !== this.cartData.address.countryId ||
          checkoutAddress["region"] !== "" ||
          checkoutAddress["region_id"] !== "" ||
          checkoutAddress["postcode"] !== null
        ) {
          this.cartData.address.countryId = checkoutAddress["country_id"];
          this.cartData.address.region = checkoutAddress["region"];
          this.cartData.address.postcode = checkoutAddress["postcode"];
        }
      }
    },

    getSortedCountries() {
      return Object.keys(this.directoryData)
        .filter((countryKey) => countryKey !== "data_id")
        .sort((a, b) => {
          if (this.directoryData[a].name < this.directoryData[b].name) {
            return -1;
          }
          if (this.directoryData[a].name > this.directoryData[b].name) {
            return 1;
          }
          return 0;
        })
        .map((countryId) => {
          return {
            id: countryId,
            name: this.directoryData[countryId].name || countryId,
          };
        });
    },

    setCountry(countryId) {
      this.cartData.address = {
        countryId: countryId,
        region: "",
        postcode: null,
      };
      this.checkoutData.shippingAddressFromData = {
        country_id: countryId,
        region: "",
        postcode: null,
      };

      if (this.directoryData[countryId].regions) {
        this.cartData.address.regionCode = "";
        this.cartData.address.regionId = 0;

        this.checkoutData.shippingAddressFromData.region_code = "";
        this.checkoutData.shippingAddressFromData.region_id = 0;
      }

      this.saveToCustomerSectionData();
      this.fetchShippingMethods();
    },

    saveToCustomerSectionData() {
      const browserStorage = window.hyva.getBrowserStorage();

      const sectionData = JSON.parse(
        browserStorage.getItem("mage-cache-storage"),
      );

      if (!sectionData["checkout-data"]) {
        sectionData["checkout-data"] = {};
      }
      if (!sectionData["cart-data"]) {
        sectionData["cart-data"] = {};
      }

      sectionData["checkout-data"].shippingAddressFromData =
        this.checkoutData.shippingAddressFromData;
      sectionData["cart-data"].address = this.cartData.address;

      browserStorage.setItem("mage-cache-storage", JSON.stringify(sectionData));
    },

    fetchShippingMethods() {
      if (!this.cartData.address) {
        return;
      }

      if (this.abortController) {
        this.abortController.abort();
      }

      Alpine.store("cart").isLoading = true;

      this.abortController = new AbortController();
      const path = fetchShippingMethodsUrl(
        this.customer && this.customer.fullname,
        this.cart.cartId,
      );

      fetch(path + "?form_key=" + window.hyva.getFormKey(), {
        signal: this.abortController.signal,
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          address: this.cartData.address,
        }),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.length && !this.availableShippingMethods.length) {
            // Adjust accordion height
            if (this.$refs.AccordionPanel) {
              this.$refs.AccordionPanel.style.maxHeight = "1000px";
            }
          }
          this.availableShippingMethods = result;

          if (
            !this.availableShippingMethods.find((method) => {
              return (
                method.carrier_code + "_" + method.method_code ===
                this.shippingMethod
              );
            })
          ) {
            this.shippingMethod = false;
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          Alpine.store("cart").isLoading = false;
        });
    },

    hasAvailableRegions() {
      return (
        this.cartData.address &&
        this.cartData.address?.countryId &&
        this.getAvailableRegions().length
      );
    },
    getAvailableRegions() {
      const countryId = this.cartData.address?.countryId;
      if (
        countryId &&
        this.directoryData[countryId] &&
        this.directoryData[countryId].regions
      ) {
        return Object.keys(this.directoryData[countryId].regions).map(
          (regionId) => {
            return {
              id: regionId,
              code: this.directoryData[countryId].regions[regionId].code,
              name: this.directoryData[countryId].regions[regionId].name,
            };
          },
        );
      }
      return [];
    },

    setRegion(value, type) {
      if (type === "select") {
        const countryId = this.cartData.address.countryId;
        const regionId = value || 0;
        const regionData = this.directoryData[countryId].regions[regionId] || {
          code: "",
          name: "",
        };

        this.cartData.address.regionId = regionId;
        this.cartData.address.regionCode = regionData.code;
        this.cartData.address.region = regionData.name;

        this.checkoutData.shippingAddressFromData.region_id = regionId;
        this.checkoutData.shippingAddressFromData.region_code = regionData.code;
        this.checkoutData.shippingAddressFromData.region = regionData.name;
      } else {
        this.cartData.address.region = value;
        this.checkoutData.shippingAddressFromData.region = value;
      }

      this.saveToCustomerSectionData();
      this.fetchShippingMethods();
    },

    fetchTotals() {
      if (this.abortController) {
        this.abortController.abort();
      }

      let carrierCode = null;
      let methodCode = null;

      if (this.shippingMethod) {
        const splitShippingMethod = this.shippingMethod.split("_");
        carrierCode = splitShippingMethod[0];
        methodCode = this.shippingMethod.replace(carrierCode + "_", "") || null;
      }

      const path = fetchTotalsUrl(
        this.customer && this.customer.fullname,
        this.cart.cartId,
      );
      this.abortController = new AbortController();

      fetch(path + "?form_key=" + window.hyva.getFormKey(), {
        signal: this.abortController.signal,
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          addressInformation: {
            shipping_carrier_code: carrierCode,
            shipping_method_code: methodCode,
            address: this.cartData.address,
          },
        }),
      })
        .then((response) => response.json())
        .then((result) => {
          Alpine.store("cart").updateCartTotals(result);
          Alpine.store("cart").cartTotals.selected_shipping_method =
            this.shippingMethod;
        })
        .catch((e) => {
          console.error(e);
        });
    },

    getEstimatedShippingRateCarriers() {
      return Array.from(
        new Set(
          this.availableShippingMethods.map((rate) => rate.carrier_title),
        ),
      );
    },

    getRatesForCarrier(carrierTitle) {
      return this.availableShippingMethods.filter(
        (rate) => rate.carrier_title === carrierTitle,
      );
    },

    updateShippingMethod() {
      this.fetchTotals();
    },

    setPostcode(value) {
      this.cartData.address.postcode = value;
      this.checkoutData.shippingAddressFromData.postcode = value;

      this.saveToCustomerSectionData();
      this.fetchShippingMethods();
    },

    toggleEstimateShipping() {
      this.showEstimateShipping = !this.showEstimateShipping;

      window.hyva
        .getBrowserStorage()
        .setItem("hyva.showEstimateShipping", this.showEstimateShipping);

      if (this.showEstimateShipping) {
        this.fetchShippingMethods();
      }
    },
  };
