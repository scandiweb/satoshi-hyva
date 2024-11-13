export type StrengthLabelsType = {
  noPassword: string;
  weak: string;
  medium: string;
  strong: string;
  veryStrong: string;
};

export type PasswordValidationType = {
  zxcvbnScriptUrl: string;
  strengthLabels: StrengthLabelsType;
  validationMessage: string;
  init(): void;
  destroy(): void;
};

export const PasswordValidation = (
  {
    zxcvbnScriptUrl,
    strengthLabels,
    validationMessage,
  }: {
    zxcvbnScriptUrl: string;
    strengthLabels: StrengthLabelsType;
    validationMessage: string;
  }): PasswordValidationType => {
  let loading = false;
  const callbacks: Array<() => void> = [];

  const _calculateStrength = ({elementID, valid}: { elementID: string; valid: boolean }) => {
    const password = document.getElementById(elementID) as HTMLInputElement | null;
    const emailElm = document.getElementById("email_address") as HTMLInputElement | null;
    let displayScore: number;

    // Display score is based on combination of whether password is empty, valid, and zxcvbn strength
    if (!password || !password.value) {
      displayScore = 0;
    } else {
      // We should only perform this check in case there is an email field on screen
      if (emailElm && password.value.toLowerCase() === emailElm.value.toLowerCase()) {
        displayScore = 1;
      } else {
        const zxcvbnScore = window.zxcvbn ? window.zxcvbn(password.value).score : 0;
        displayScore = valid && zxcvbnScore > 0 ? zxcvbnScore : 1;
      }
    }

    _displayStrength(displayScore);
  }

  const _displayStrength = (displayScore: number) => {
    let strengthLabel = "";
    let className = "";

    switch (displayScore) {
      case 0:
        strengthLabel = strengthLabels.noPassword;
        className = "password-none";
        break;
      case 1:
        strengthLabel = strengthLabels.weak;
        className = "password-weak";
        break;
      case 2:
        strengthLabel = strengthLabels.medium;
        className = "password-medium";
        break;
      case 3:
        strengthLabel = strengthLabels.strong;
        className = "password-strong";
        break;
      case 4:
        strengthLabel = strengthLabels.veryStrong;
        className = "password-very-strong";
        break;
    }

    const meterElm = document.getElementById("password-strength-meter-container");
    const meterLabelElm = document.getElementById("password-strength-meter-label");

    if (meterElm && meterLabelElm) {
      meterElm.className = "";
      meterElm.classList.add(className);
      meterLabelElm.textContent = strengthLabel;
    }
  }

  const loadZxcvbn = (cb: () => void) => {
    callbacks.push(cb);
    if (loading) return;
    loading = true;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = zxcvbnScriptUrl;
    script.async = true;
    script.onload = () => callbacks.forEach((callback) => callback());
    document.head.appendChild(script);
  }

  const addPasswordValidationRule = () => {
    if (window.hyva?.formValidation) {
      window.hyva.formValidation.addRule("password-strength", (value: string, options: {
        minCharacterSets?: number
      }, field: any) => {
        let counter = 0;
        const minCharacterSets = options.minCharacterSets !== undefined ? options.minCharacterSets : 1;

        if (value.match(/\d+/)) counter++;
        if (value.match(/[a-z]+/)) counter++;
        if (value.match(/[A-Z]+/)) counter++;
        if (value.match(/[^a-zA-Z0-9]+/)) counter++;

        queueMicrotask(() => {
          window.dispatchEvent(
            new CustomEvent("password-validate", {
              detail: {elementID: field.element.id || "password", valid: field.state.valid},
            })
          );
        });

        if (counter < minCharacterSets) {
          const missing = minCharacterSets - counter;
          return window.hyva.str(validationMessage, missing);
        }
        return true;
      });
    }
  }

  const passwordValidationCallback = (evt: CustomEvent) => {
    const meterElm = document.getElementById("password-strength-meter-container");
    const meterLabelElm = document.getElementById("password-strength-meter-label");

    if (meterElm && meterLabelElm) {
      if (evt.detail && evt.detail.elementID) {
        const cb = () => _calculateStrength(evt.detail);
        window.zxcvbn ? cb() : loadZxcvbn(cb);
      }
    }
  }

  return {
    zxcvbnScriptUrl,
    strengthLabels,
    validationMessage,

    init() {
      addPasswordValidationRule();
      window.addEventListener("password-validate", (passwordValidationCallback) as EventListener);
    },

    destroy() {
      window.removeEventListener("password-validate", (passwordValidationCallback) as EventListener);
    }
  };
};
