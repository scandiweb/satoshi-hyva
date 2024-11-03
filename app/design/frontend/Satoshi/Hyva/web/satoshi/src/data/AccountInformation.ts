import { Magics } from "alpinejs";
import { FormType } from "./Form";

export type AccountInformationType = {
  showEmailField: boolean;
  showPasswordFields: boolean;
  handleCheckboxChange(checkboxId: string): void;
} & FormType &
  Magics<{}>;

export const AccountInformation = (
  initialShowEmailField: boolean,
  initialShowPasswordFields: boolean,
) =>
  <AccountInformationType>{
    showEmailField: !!initialShowEmailField,
    showPasswordFields: !!initialShowPasswordFields,

    handleCheckboxChange(checkboxId) {
      this.$nextTick(() => {
        const firstFocusableElement = document.querySelector(
          `#${checkboxId} input, #${checkboxId} textarea, #${checkboxId} select`,
        ) as HTMLElement;
        if (firstFocusableElement) {
          firstFocusableElement.focus();
        }
      });
    },
  };
