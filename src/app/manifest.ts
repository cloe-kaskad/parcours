import type { MetadataRoute } from "next";

// L'application installable (brief du 22 novembre) : plein écran, portrait, couleurs de la charte.
// « / » redirige selon le rôle : /espace pour une cliente, /coach pour Cloé, /emilien pour Émilien.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Blocages & Intuition",
    short_name: "B&I",
    description: "L’espace des clientes de Blocages & Intuition.",
    lang: "fr",
    start_url: "/?source=application",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#59114D",
    theme_color: "#59114D",
    icons: [
      { src: "/pwa/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
