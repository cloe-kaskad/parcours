"use client";

import { useEffect } from "react";
import { ecouterInvitation } from "@/lib/installation";

// Le service worker (public/sw.js) : relire sans réseau, seulement en production.
// Écoute aussi, dès l'ouverture, l'invitation à installer du navigateur (Android).
export function EnregistrerServiceWorker() {
  useEffect(() => {
    ecouterInvitation();
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
