/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "color-background-brand-default":
          "var(--color-background-brand-default)",
        "color-background-brand-hover": "var(--color-background-brand-hover)",
        "color-border-brand-default": "var(--color-border-brand-default)",
        "color-primitives-brand-300": "var(--color-primitives-brand-300)",
        "color-text-brand-on-brand": "var(--color-text-brand-on-brand)",
        "m3-schemes-on-surface-variant": "var(--m3-schemes-on-surface-variant)",
        "m3-schemes-surface-container-high":
          "var(--m3-schemes-surface-container-high)",
        "m3-schemes-surface-container-lowest":
          "var(--m3-schemes-surface-container-lowest)",
        "m3-state-layers-on-surface-variant-opacity-08":
          "var(--m3-state-layers-on-surface-variant-opacity-08)",
      },
      fontFamily: {
        inner: "var(--inner-font-family)",
        "m3-body-large": "var(--m3-body-large-font-family)",
        "m3-label-medium": "var(--m3-label-medium-font-family)",
        "single-line-body-base": "var(--single-line-body-base-font-family)",
        subheadings: "var(--subheadings-font-family)",
        text: "var(--text-font-family)",
        users: "var(--users-font-family)",
      },
    },
  },
  plugins: [],
};
