// Le bouton « Se déconnecter », le même partout : un formulaire vers /auth/deconnexion.
export function Deconnexion({ className = "" }: { className?: string }) {
  return (
    <form action="/auth/deconnexion" method="post" className="contents">
      <button type="submit" className={`inline-flex min-h-[44px] shrink-0 items-center text-[13px] ${className}`}>
        Se déconnecter
      </button>
    </form>
  );
}
