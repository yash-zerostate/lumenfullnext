import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070b14",
          900: "#0b1120",
          800: "#111a2e",
          700: "#1b263f",
        },
        brand: {
          400: "#7aa2ff",
          500: "#4f7dff",
          600: "#3b63e0",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
