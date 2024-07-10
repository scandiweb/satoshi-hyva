const {
  spacing
} = require('tailwindcss/defaultTheme');

const colors = require('tailwindcss/colors');

const hyvaModules = require('@hyva-themes/hyva-modules');

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
      screens: {
        'sm': '640px',
        // => @media (min-width: 640px) { ... }
        'md': '768px',
        // => @media (min-width: 768px) { ... }
        'lg': '1024px',
        // => @media (min-width: 1024px) { ... }
        'xl': '1280px',
        // => @media (min-width: 1280px) { ... }
        '2xl': '1536px', // => @media (min-width: 1536px) { ... }
        "max-2xl": { max: "1535px" },
        "max-xl": { max: "1279px" },
        "max-lg": { max: "1023px" },
        "max-md": { max: "767px" },
        "max-sm": { max: "639px" },
      },
      truncate: {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
      aspectRatio: {
        product: "var(--product-aspect-ratio)",
      },
      boxShadow: {
        outline: "0 0 0 3px rgba(66, 153, 225, 0.6)",
        input: "0 0 0 1px #757575",
        error: "0 0 0 1px rgb(229, 62, 62)",
      },
      fontFamily: {
        sans: ["Segoe UI", "Helvetica Neue", "Arial", "sans-serif"]
      },
      fonts: {
        heading: "Satoshi, sans-serif",
        body: "Satoshi, sans-serif",
      },
      colors: {
        primary: {
          50: "#EDEDED",
          100: "#757575",
          500: "#181818",
          600: "#3F3F3F",
          lighter: colors.blue['300'],
          "DEFAULT": colors.blue['800'],
          darker: colors.blue['900']
        },
        secondary: {
          50: "#F5F5F5",
          100: "#E5E5E5",
          400: "#a4a4a4",
          500: "#757575",
          600: "#757575",
          700: "#181818",
          lighter: colors.blue['100'],
          "DEFAULT": colors.blue['200'],
          darker: colors.blue['300']
        },
        text: {
          50: "#EDEDED",
          100: "#757575",
          500: "#181818",
          700: "#797979",
        },
        background: {
          lighter: colors.blue['100'],
          "DEFAULT": colors.blue['200'],
          darker: colors.blue['300']
        },
        green: colors.emerald,
        yellow: colors.amber,
        purple: colors.violet,
        placeholder: "#718096",
        "border-color": "#e2e8f0",
        shadow: "#00000033",
        overlay: "#18181833",
        "overlay-dark": "#18181866",
        "primary-bg": "#181818",
        "text-on-primary-bg": "#FFFFFF",
        fg: "#FFFFFF",
        "text-on-fg": "#181818",
        error: "#B40C1C",
        // secondary colors (must not catch attention)
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
      textColor: {
        orange: colors.orange,
        red: { ...colors.red,
          "DEFAULT": colors.red['500']
        },
        primary: {
          lighter: colors.gray['700'],
          "DEFAULT": colors.gray['800'],
          darker: colors.gray['900']
        },
        secondary: {
          lighter: colors.gray['400'],
          "DEFAULT": colors.gray['600'],
          darker: colors.gray['800']
        }
      },
      width: defaultWidthHeight,
      height: defaultWidthHeight,
      minWidth: defaultWidthHeight,
      minHeight: defaultWidthHeight,
      maxWidth: {
        screen: "100vw",
      },
      fontSize: {
        "2xs": "0.625rem",
        xs: "0.75rem",
        sm: "12px",
        md: "14px",
        lg: "18px",
        xl: "20px",
        xxl: "24px",
      },
      transitionDelay: {
        0: "0ms",
        150: "150ms",
        450: "450ms",
      },
      gridTemplateColumns: {
        header: "40px 40px 1fr 40px 40px",
        productOptions: "repeat(auto-fit, minmax(110px, 1fr))",
      },
      backgroundColor: {
        primary: {
          lighter: colors.blue['600'],
          "DEFAULT": colors.blue['700'],
          darker: colors.blue['800']
        },
        secondary: {
          lighter: colors.blue['100'],
          "DEFAULT": colors.blue['200'],
          darker: colors.blue['300']
        },
        container: {
          lighter: '#ffffff',
          "DEFAULT": '#fafafa',
          darker: '#f5f5f5'
        }
      },
      borderColor: {
        primary: {
          lighter: colors.blue['600'],
          "DEFAULT": colors.blue['700'],
          darker: colors.blue['800']
        },
        secondary: {
          lighter: colors.blue['100'],
          "DEFAULT": colors.blue['200'],
          darker: colors.blue['300']
        },
        container: {
          lighter: '#f5f5f5',
          "DEFAULT": '#e7e7e7',
          darker: '#b6b6b6'
        }
      },
      minWidth: {
        7: spacing["7"],
        8: spacing["8"],
        9: spacing["9"],
        10: spacing["10"],
        11: spacing["11"],
        12: spacing["12"],
        20: spacing["20"],
        40: spacing["40"],
        48: spacing["48"]
      },
      minHeight: {
        11: '44px',
        14: spacing["14"],
        a11y: '44px',
        'screen-25': '25vh',
        'screen-50': '50vh',
        'screen-75': '75vh'
      },
      maxHeight: {
        '0': '0',
        'screen-25': '25vh',
        'screen-50': '50vh',
        'screen-75': '75vh'
      },
      container: {
        center: true,
        padding: '1.5rem'
      }
    }
  },
  // Examples for excluding patterns from purge
  content: [
    // this theme's phtml and layout XML files
    '../../**/*.phtml',
    '../../*/layout/*.xml',
    '../../*/page_layout/override/base/*.xml',
    // parent theme in Vendor (if this is a child-theme)
    '../../../../../../../vendor/hyva-themes/magento2-default-theme/**/*.phtml',
    '../../../../../../../vendor/hyva-themes/magento2-default-theme/*/layout/*.xml',
    '../../../../../../../vendor/hyva-themes/magento2-default-theme/*/page_layout/override/base/*.xml',
    // app/code phtml files (if need tailwind classes from app/code modules)
    '../../../../../../../app/code/**/*.phtml',
  ]
});
