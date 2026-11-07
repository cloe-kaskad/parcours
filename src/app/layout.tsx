import type { Metadata, Viewport } from "next";
// Polices auto-hébergées (pas d'appel à Google Fonts côté clientes).
import "@fontsource-variable/league-spartan";
import "@fontsource-variable/dm-sans";
import "@fontsource/libre-baskerville/400-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Blocages & Intuition", template: "%s · Blocages & Intuition" },
  description: "L'espace des clientes de Blocages & Intuition.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#F5EDE3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
