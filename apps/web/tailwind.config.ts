import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        amiri: ["Amiri", "serif"],
        naskh: ["Noto Naskh Arabic", "serif"]
      },
      colors: {
        ink: "#17211b",
        mist: "#f5f7f4",
        leaf: "#2f6f5e",
        gold: "#b58d2a",
        clay: "#b85f45"
      }
    }
  },
  plugins: []
};

export default config;
