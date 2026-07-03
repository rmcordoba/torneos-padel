import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";

// Fuentes self-hosted (next/font): sin requests a Google Fonts en runtime,
// sin CSS bloqueante y sin layout shift (fallback ajustado automático).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | PadelPro",
    default: "PadelPro",
  },
  description: "Plataforma de gestión de torneos de pádel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
