import { replaceMainContentWithTransition } from "../plugins/Transition";

type PostParams = {
  action: string;
  data: Record<string, string>;
  skipUenc?: boolean;
};

export type FormType = {
  isLoading: boolean;
  errors: number;
  hasCaptchaToken: number;
  displayErrorMessage: boolean | number;
  errorMessages: string[];

  setErrorMessages(messages: string[]): void;
  postForm(postParams: PostParams): Promise<void>;
  submitForm(event: Event): void;
};

export const Form = () => {
  return <FormType>{
    isLoading: false,
    errors: 0,
    hasCaptchaToken: 0,
    displayErrorMessage: false,
    errorMessages: [],

    setErrorMessages(messages) {
      this.errorMessages = messages;
      this.displayErrorMessage = !!this.errorMessages.length;
    },

    async postForm(postParams) {
      this.isLoading = true;

      const form = document.createElement("form");

      let data = postParams.data;

      if (!postParams.skipUenc && !data.uenc) {
        data.uenc = btoa(window.location.href);
      }
      form.method = "POST";
      form.action = postParams.action;

      Object.keys(postParams.data).map(key => {
        const field = document.createElement("input");
        field.type = "hidden";
        field.value = postParams.data[key];
        field.name = key;
        form.appendChild(field);
      });

      const form_key = document.createElement("input");
      form_key.type = "hidden";
      form_key.value = window.hyva.getFormKey();
      form_key.name = "form_key";
      form.appendChild(form_key);

      return fetch(form.action, {
        method: "POST",
        body: new FormData(form),
      })
        .then((response) => {
          return response.text().then(async (content) => {
            await replaceMainContentWithTransition(response.url, content);
          });
        })
        .catch((error) => {
          console.error("Form submission failed", error);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },

    submitForm(event) {
      const $form = event.target as HTMLFormElement;
      const formData = new FormData($form);
      this.isLoading = true;

      fetch($form.action, {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      })
        .then((response) => {
          return response.text().then(async (content) => {
            await replaceMainContentWithTransition(response.url, content);
          });
        })
        .catch((error) => {
          console.error("Form submission failed:", error);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
  };
};
