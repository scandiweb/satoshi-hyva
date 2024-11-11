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
  minCharacterSets: number;
  validationMessage: string;
  init(): void;
};

export const PasswordValidation = (
  {
    zxcvbnScriptUrl,
    strengthLabels,
    minCharacterSets,
    validationMessage,
  }: {
    zxcvbnScriptUrl: string;
    strengthLabels: StrengthLabelsType;
    minCharacterSets: number;
    validationMessage: string;
  }): PasswordValidationType => {
  let loading = false;
  const callbacks: Array<() => void> = [];

  function _calculateStrength({elementID, valid}: { elementID: string; valid: boolean }) {
    const password = document.getElementById(elementID) as HTMLInputElement | null;
    const emailElm = document.getElementById("email_address") as HTMLInputElement | null;
    let displayScore: number;

    if (!password || !password.value) {
      displayScore = 0;
    } else if (emailElm && password.value.toLowerCase() === emailElm.value.toLowerCase()) {
      displayScore = 1;
    } else {
      const zxcvbnScore = window.zxcvbn ? window.zxcvbn(password.value).score : 0;
      displayScore = valid && zxcvbnScore > 0 ? zxcvbnScore : 1;
    }

    _displayStrength(displayScore);
  }

  function _displayStrength(displayScore: number) {
    const strengthLabel = [
      strengthLabels.noPassword,
      strengthLabels.weak,
      strengthLabels.medium,
      strengthLabels.strong,
      strengthLabels.veryStrong,
    ][displayScore] || "";
    const className = [
      "password-none",
      "password-weak",
      "password-medium",
      "password-strong",
      "password-very-strong",
    ][displayScore] || "";

    const meterElm = document.getElementById("password-strength-meter-container");
    const meterLabelElm = document.getElementById("password-strength-meter-label");

    if (meterElm && meterLabelElm) {
      meterElm.className = "";
      meterElm.classList.add(className);
      meterLabelElm.textContent = strengthLabel;
    }
  }

  function loadZxcvbn(cb: () => void) {
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

  function addPasswordValidationRule() {
    if (window.hyva?.formValidation) {
      window.hyva.formValidation.addRule("password-strength", (value: string, options: {
        minCharacterSets?: number
      }, field: any) => {
        let counter = 0;
        const minSets = options.minCharacterSets ?? minCharacterSets;

        if (/\d+/.test(value)) counter++;
        if (/[a-z]+/.test(value)) counter++;
        if (/[A-Z]+/.test(value)) counter++;
        if (/[^a-zA-Z0-9]+/.test(value)) counter++;

        queueMicrotask(() => {
          window.dispatchEvent(
            new CustomEvent("password-validate", {
              detail: {elementID: field.element.id || "password", valid: field.state.valid},
            })
          );
        });

        if (counter < minSets) {
          const missing = minSets - counter;
          return window.hyva.str(validationMessage, missing);
        }
        return true;
      });
    }
  }

  return {
    zxcvbnScriptUrl,
    strengthLabels,
    minCharacterSets,
    validationMessage,

    init() {
      addPasswordValidationRule();

      window.addEventListener("password-validate", ((evt: CustomEvent) => {
        if (evt.detail && evt.detail.elementID) {
          const cb = () => _calculateStrength(evt.detail);
          window.zxcvbn ? cb() : loadZxcvbn(cb);
        }
      }) as EventListener);
    },
  };
};
