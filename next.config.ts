import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Application entièrement personnalisée (session par cookie) : pas de cache de composants.
  cacheComponents: false,
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
