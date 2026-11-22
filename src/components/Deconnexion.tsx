"use client";

// Le bouton « Se déconnecter », le même partout : un formulaire vers /auth/deconnexion.
// Avant de partir, le téléphone oublie les pages gardées pour la lecture hors connexion et les brouillons.
async function oublier() {
  try {
    if ("caches" in window) await Promise.all((await caches.keys()).map((c) => caches.delete(c)));
    navigator.serviceWorker?.controller?.postMessage("vider");
    for (const cle of Object.keys(localStorage)) if (cle.startsWith("brouillon-")) localStorage.removeItem(cle);
  } catch {
    // la déconnexion passe quand même
  }
}

export function Deconnexion({ className = "" }: { className?: string }) {
  return (
    <form
      action="/auth/deconnexion"
      method="post"
      className="contents"
      onSubmit={async (e) => {
        e.preventDefault();
        const formulaire = e.currentTarget;
        await oublier();
        formulaire.submit();
      }}
    >
      <button type="submit" className={`inline-flex min-h-[44px] shrink-0 items-center text-[14px] ${className}`}>
        Se déconnecter
      </button>
    </form>
  );
}
