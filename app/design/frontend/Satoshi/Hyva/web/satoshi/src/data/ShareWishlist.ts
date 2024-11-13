import { Magics } from "alpinejs";

export type ShareWishlistType = {
  isLoading: boolean;
  isValid: boolean;
  validateEmailsRegex: RegExp;
  validateForm(): boolean;
} & Magics<{}>;

export const ShareWishlist = (
  emailSharingLimit: number,
  invalidEmailMessage: string,
  emailLimitMessage: string,
) =>
  <ShareWishlistType>{
    isLoading: false,
    isValid: true,
    validateEmailsRegex:
      /^([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*@([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*\.(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]){2,})$/i,

    validateForm() {
      const emailField = this.$refs["emails"] as HTMLTextAreaElement;
      const emails = emailField.value.split(/[\s\n\,]+/g);

      for (let i = 0; i < emails.length; i++) {
        if (!this.validateEmailsRegex.test(emails[i].trim())) {
          this.isValid = false;
          emailField.setCustomValidity(invalidEmailMessage);
          return false;
        }
      }

      if (emails.length > emailSharingLimit) {
        emailField.setCustomValidity(emailLimitMessage);
        return false;
      }

      this.isValid = true;
      emailField.setCustomValidity("");
      return true;
    },
  };
