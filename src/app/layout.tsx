import type { Metadata, Viewport } from "next";
// Polices auto-hébergées (pas d'appel à Google Fonts côté clientes).
import "@fontsource-variable/league-spartan";
import "@fontsource-variable/dm-sans";
import "@fontsource/libre-baskerville/400-italic.css";
import "./globals.css";
import { EnregistrerServiceWorker } from "@/components/EnregistrerServiceWorker";

// Écrans de démarrage iPhone (largeur, hauteur en points, densité), générés par design/pwa/generer-icones.cjs.
const ECRANS: [number, number, number][] = [
  [440, 956, 3], [402, 874, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [375, 667, 2],
];

export const metadata: Metadata = {
  title: { default: "Blocages & Intuition", template: "%s · Blocages & Intuition" },
  description: "L'espace des clientes de Blocages & Intuition.",
  robots: { index: false, follow: false },
  applicationName: "Blocages & Intuition",
  // iPhone : icône, plein écran sans barre de Safari, écran de démarrage violet avec le logo.
  appleWebApp: {
    capable: true,
    title: "B&I",
    statusBarStyle: "black-translucent",
    startupImage: ECRANS.map(([l, h, d]) => ({
      url: `/pwa/demarrage-${l * d}x${h * d}.png`,
      media: `(device-width: ${l}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${d}) and (orientation: portrait)`,
    })),
  },
  icons: { apple: "/pwa/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

// viewport-fit=cover : la page passe sous l'encoche et la barre du bas, les marges viennent de env(safe-area-inset-*).
export const viewport: Viewport = {
  themeColor: "#F5EDE3",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full">
      <body className="flex min-h-full flex-col">
        {children}
        <EnregistrerServiceWorker />
      </body>
    </html>
  );
}
