import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FAF7F0",
        emerald: { DEFAULT: "#065F46", deep: "#064E3B" },
        gold: "#C9A227",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: { soft: "0 2px 16px rgba(6,78,59,0.07)" },
    },
  },
  plugins: [],
};
export default config;
