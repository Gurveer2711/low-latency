import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#FFFFFF",
          secondary: "#F9F9F9",
        },
        primary: {
          DEFAULT: "#FF0000",
        },
        text: {
          primary: "#0F0F0F",
          secondary: "#606060",
        },
        border: {
          DEFAULT: "#E5E5E5",
        },
        cardHover: {
          DEFAULT: "#F2F2F2",
        },
        navbar: {
          DEFAULT: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
