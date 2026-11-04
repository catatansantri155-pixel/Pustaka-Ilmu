import type { Config } from "tailwindcss";
// Token desain hasil port prototipe Lovable "Pustaka Ilmu" (Nov 2026):
// palet teal tua + kertas hangat + emas, dikonversi dari token oklch Lovable
// (lihat ~/workspace/lovable/port-pustaka-lovable/src__styles.css).
// Nama warna lama dipertahankan agar seluruh kelas yang ada tetap bekerja;
// yang berubah adalah NILAI warnanya mengikuti sistem desain Lovable.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F9F6F1",
        paper: "#FDFAF1",
        white: "#FFFFFF",
        card: "#FEFDFA",
        emerald: { DEFAULT: "#174D40", deep: "#08362E" },
        gold: "#CA9C4E",
        goldink: "#845922",
        ink: "#12231F",
        muted: "#505F5A",
        line: "#E2DED5",
        surface: "#F0ECE5",
        secondary: { DEFAULT: "#E4EEE8", foreground: "#0A362C" },
        accent: { DEFAULT: "#F4E6CA", foreground: "#513716" },
      },
      fontFamily: {
        sans: ["'Figtree'", "ui-sans-serif", "system-ui", "sans-serif"],
        read: ["'Literata'", "Georgia", "serif"],
        arabic: ["'Amiri'", "'Noto Naskh Arabic'", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(18,35,31,0.06), 0 8px 24px -12px rgba(18,35,31,0.18)",
        lift: "0 14px 34px -12px rgba(18,35,31,0.22)",
        pill: "0 10px 30px rgba(18,35,31,0.20)",
      },
    },
  },
  plugins: [],
};
export default config;
