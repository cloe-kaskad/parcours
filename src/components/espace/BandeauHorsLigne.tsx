"use client";

import { useSyncExternalStore } from "react";

const abonner = (f: () => void) => {
  window.addEventListener("online", f);
  window.addEventListener("offline", f);
  return () => {
    window.removeEventListener("online", f);
    window.removeEventListener("offline", f);
  };
};

// Sans réseau : un bandeau clair, en bas de l'écran, au-dessus de la barre de l'iPhone.
export function BandeauHorsLigne() {
  const enLigne = useSyncExternalStore(abonner, () => navigator.onLine, () => true);
  if (enLigne) return null;
  return (
    <p role="status" className="fixed inset-x-0 bottom-0 z-40 bg-rose px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 text-center text-[15px] leading-[1.45] text-violet-nuit">
      Pas de réseau. Tu peux relire tes pratiques et ton carnet ; pour écrire, attends son retour.
    </p>
  );
}
