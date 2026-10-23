import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ReaderShell from "@/components/ReaderShell";

export const metadata: Metadata = {
  title: { default: "Pustaka Ilmu", template: "%s · Pustaka Ilmu" },
  description: "Perpustakaan fatwa dan khazanah Islam: materi Thaharah dari para ulama, teks Arab beserta terjemahan Indonesia.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#065F46" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body><ReaderShell>{children}</ReaderShell></body>
    </html>
  );
}
