import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#c2652a",
        background: "#faf5ee",
        tertiary: "#8c3c3c",
        surface: "#fff8f0",
        border: "rgba(216, 208, 200, 0.6)",
        warm: {
          50: '#faf5ee',
          100: '#f5eee5',
          200: '#eadecd',
          300: '#d8c8b0',
          400: '#c5ae8f',
          500: '#b69772',
          600: '#a7825d',
          700: '#8c684a',
          800: '#73553e',
          900: '#5e4635',
        }
      },
      fontFamily: {
        heading: ["'EB Garamond'", "serif"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 16px rgba(58, 48, 42, 0.04)",
      },
      borderRadius: {
        DEFAULT: "8px",
      }
    },
  },
  plugins: [],
} satisfies Config;
