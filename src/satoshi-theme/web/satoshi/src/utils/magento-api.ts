export const REST_API_URL = BASE_URL + "rest/" + CURRENT_STORE_CODE;

export const fetchShippingMethodsUrl = (isCustomer: boolean, cartId = null) => {
  if (isCustomer) {
    return REST_API_URL + "/V1/carts/mine/estimate-shipping-methods";
  }

  return (
    REST_API_URL + "/V1/guest-carts/" + cartId + "/estimate-shipping-methods"
  );
};

export const fetchTotalsUrl = (isCustomer: boolean, cartId = null) => {
  if (isCustomer) {
    return REST_API_URL + "/V1/carts/mine/totals-information";
  }

  return REST_API_URL + "/V1/guest-carts/" + cartId + "/totals-information";
};
