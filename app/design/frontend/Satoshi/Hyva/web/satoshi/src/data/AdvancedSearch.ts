import { Magics } from "alpinejs";
import { navigateWithTransition } from "../plugins/Transition";

export type AdvancedSearchType = {
  isLoading: boolean;

  submitForm(event: Event): void;
} & Magics<{}>;

export const AdvancedSearch = () =>
    <AdvancedSearchType>{
      isLoading: false,

      submitForm(event) {
        const $form = event.target as HTMLFormElement;
        if (!$form) return;

        const formData = new FormData($form);
        const queryString = new URLSearchParams(formData as any).toString();
        const requestUrl = `${$form.action}?${queryString}`;

        this.isLoading = true;
        fetch(requestUrl, {
          method: "GET",
        })
            .then(async (res) => {
              if (res.ok) {
                if (res.url === window.location.href) {
                  window.hyva.replaceDomElement("#maincontent", await res.text());
                  return;
                }

                navigateWithTransition(res.url);
              }
            })
            .catch((error) => {
              console.error("Error while advanced searching:", error);
              location.reload();
            })
            .finally(() => {
              this.isLoading = false;
            });
      },
    };
