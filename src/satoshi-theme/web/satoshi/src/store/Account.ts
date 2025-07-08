export type AccountStoreType = {
  showAccount(): void;
  hideAccount(): void;
};

const ACCOUNT_RESIZABLE_ID = 'account-desktop';
const ACCOUNT_POPUP_ID = 'account';

export const AccountStore = <AccountStoreType>{
  showAccount() {
    if (Alpine.store('main').isMobile) {
      Alpine.store('popup').showPopup(ACCOUNT_POPUP_ID, true);
    } else {
      Alpine.store('resizable').show(ACCOUNT_RESIZABLE_ID);
    }
  },

  hideAccount() {
    if (Alpine.store('main').isMobile) {
      Alpine.store('popup').hidePopup(ACCOUNT_POPUP_ID);
    } else {
      Alpine.store('resizable').hide(ACCOUNT_RESIZABLE_ID);
    }
  },
};
