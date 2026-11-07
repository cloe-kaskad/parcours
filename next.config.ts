import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Application entièrement personnalisée (session par cookie) : pas de cache de composants.
  cacheComponents: false,
  experimental: {
    // Dépôt de PDF de transcript via action serveur (Vercel plafonne de toute façon à 4,5 Mo par requête).
    serverActions: { bodySizeLimit: "10mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
