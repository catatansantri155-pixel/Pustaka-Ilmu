import type { Config } from "tailwindcss";
// Design tokens Master Prompt V2.0 BAGIAN 4.2 — jangan ubah nilai tanpa keputusan produk.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FAF8F2",
        white: "#FFFFFF",
        emerald: { DEFAULT: "#14386E", deep: "#0A1F44" },
        gold: "#C9A227",
        ink: "#141D31",
        muted: "#525F7A",
        line: "#E2E6EF",
        surface: "#EDF0F7",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        arabic: ["'Noto Naskh Arabic'", "'Amiri'", "serif"],
      },
      boxShadow: {
        soft: "0 2px 16px rgba(10,31,68,0.07)",
        lift: "0 14px 34px rgba(10,31,68,0.14)",
        pill: "0 10px 30px rgba(10,31,68,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
