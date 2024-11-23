import { replaceMainContentWithTransition } from "../plugins/Transition";

export type postDataType = {
  action: string;
  data: {
    form_key: string;
    uenc: string;
  };
};

export type LogoutType = {
  isLoading: boolean;
  logout(postData: postDataType): void;
};

export const Logout = () =>
  <LogoutType>{
    isLoading: false,

    logout(postData) {
      if (this.isLoading) return;

      this.isLoading = true;

      // using postData.data causes 'Invalid Form Key' error
      const formData = new FormData();
      formData.append("form_key", window.hyva.getFormKey());
      formData.append("uenc", window.hyva.getUenc());

      fetch(postData.action, {
        method: "POST",
        body: formData,
      })
        .then((result) => {
          return result;
        })
        .then(async (response) => {
          await replaceMainContentWithTransition(response.url, await response.text());
        })
        .catch((error) => {
          console.error("Error while logging out:", error);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
  };
