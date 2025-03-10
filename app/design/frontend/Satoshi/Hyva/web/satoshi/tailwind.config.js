const { spacing } = require("tailwindcss/defaultTheme");

const colors = require("tailwindcss/colors");

const hyvaModules = require("@hyva-themes/hyva-modules");

const defaultWidthHeight = {
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
};

module.exports = hyvaModules.mergeTailwindConfig({
  theme: {
    extend: {
      aspectRatio: {
        product: "var(--product-aspect-ratio)",
      },
      boxShadow: {
        outline: "0 0 0 3px rgba(66, 153, 225, 0.6)",
        input: "0 0 0 1px var(--color-primary-500)",
        error: "0 0 0 1px rgb(229, 62, 62)",
        fadeTop: "0px -10px 15px #00000010",
      },
      colors: {
        placeholder: "#718096",
        "border-color": "#e2e8f0",
        shadow: "#00000033",
        overlay: "#18181833",
        "overlay-dark": "#18181866",
        "primary-bg": "#181818",
        "text-on-primary-bg": "#FFFFFF",
        fg: "var(--color-fg)",
        error: "#B40C1C",
        bg: {
          50: "var(--color-background-50)",
          100: "var(--color-background-100)",
          400: "var(--color-background-400)",
          500: "var(--color-background-500)",
          600: "var(--color-background-600)",
          700: "var(--color-background-700)",
        },
        // primary colors (must catch attention)
        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
        },
        // secondary colors (must not catch attention)
        secondary: {
          50: "var(--color-secondary-50)",
          100: "var(--color-secondary-100)",
          400: "var(--color-secondary-400)",
          500: "var(--color-secondary-500)",
          600: "var(--color-secondary-600)",
          700: "var(--color-secondary-700)",
        },
        text: {
          50: "var(--color-text-50)",
          100: "var(--color-text-100)",
          400: "var(--color-text-400)",
          500: "var(--color-text-500)",
          600: "var(--color-text-600)",
          700: "var(--color-text-700)",
        },
      },
      borderWidth: {
        1: "1px",
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
      },
      spacing: {
        1: "2px",
        2: "4px",
        3: "8px",
        4: "12px",
        5: "16px",
        6: "20px",
        7: "24px",
      },
      screens: {
        "max-2xl": { max: "1535px" },
        "max-xl": { max: "1279px" },
        "max-lg": { max: "1023px" },
        "max-md": { max: "767px" },
        "max-sm": { max: "639px" },
      },
      width: defaultWidthHeight,
      height: defaultWidthHeight,
      minWidth: defaultWidthHeight,
      minHeight: defaultWidthHeight,
      maxWidth: {
        screen: "100vw",
      },
      fontFamily: {
        heading: "var(--font-heading-family)",
        body: "var(--font-body-family)",
      },
      fontWeight: {
        "w-heading": "var(--font-heading-weight)",
        "w-body": "var(--font-body-weight)",
      },
      fontSize: {
        "2xs": "0.625rem",
        xs: "0.75rem",
        sm: "12px",
        md: "16px",
        lg: "18px",
        xl: "20px",
        xxl: "24px",
      },
      transitionDelay: {
        150: "150ms",
        450: "450ms",
      },
      gridTemplateColumns: {
        header: "40px 40px 1fr 40px 40px",
        addressForms: "repeat(auto-fit, 400px)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIconIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideTitleIn: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(var(--translate-width))" },
        },
        slideIconOut: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        slideTitleOut: {
          "0%": { transform: "translateX(var(--translate-width))" },
          "100%": { transform: "translateX(0)" },
        },
        pop: {
          "50%": { transform: "scale(0.95)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 500ms forwards",
        slideIconIn: "slideIconIn 300ms forwards",
        slideIconOut: "slideIconOut 300ms forwards",
        slideTitleIn: "slideTitleIn 300ms forwards",
        slideTitleOut: "slideTitleOut 300ms forwards",
        pop: "pop 300ms ease-in-out forwards",
      },
    },
  },
  // Examples for excluding patterns from purge
  content: [
    // this theme's phtml and layout XML files
    "../../**/*.phtml",
    "../../*/layout/*.xml",
    "../../*/page_layout/override/base/*.xml",
    // parent theme in Vendor (if this is a child-theme)
    "../../../../../../../vendor/hyva-themes/magento2-default-theme/**/*.phtml",
    "../../../../../../../vendor/hyva-themes/magento2-default-theme/*/layout/*.xml",
    "../../../../../../../vendor/hyva-themes/magento2-default-theme/*/page_layout/override/base/*.xml",
    // app/code phtml files (if need tailwind classes from app/code modules)
    "../../../../../../../app/code/**/*.phtml",
  ],
});
