import type { Config } from "tailwindcss";
// Design tokens Master Prompt V2.0 BAGIAN 4.2 — jangan ubah nilai tanpa keputusan produk.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FAF9F6",
        white: "#FFFFFF",
        emerald: { DEFAULT: "#176B53", deep: "#103D32" },
        gold: "#D6B979",
        ink: "#17201D",
        muted: "#52625B",
        line: "#E8EAE6",
        surface: "#F2F5F1",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        arabic: ["'Noto Naskh Arabic'", "'Amiri'", "serif"],
      },
      boxShadow: { soft: "0 2px 16px rgba(16,61,50,0.07)" },
    },
  },
  plugins: [],
};
export default config;
