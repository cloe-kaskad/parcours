import Link from "next/link";
import { Logo } from "./Logo";
import type { Profile } from "@/lib/supabase/types";

type Lien = { href: string; label: string };

// Structure commune des espaces connectés : en-tête, navigation, contenu.
export function Coquille({
  profil,
  liens,
  accueil,
  children,
}: {
  profil: Profile;
  liens: Lien[];
  accueil: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-beige/80 bg-creme/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Logo href={accueil} taille="sm" />
          <nav className="hidden items-center gap-6 md:flex" aria-label="Navigation">
            {liens.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-violet hover:text-rouge">
                {l.label}
              </Link>
            ))}
          </nav>
          <form action="/auth/deconnexion" method="post" className="flex items-center gap-3">
            <span className="hidden text-sm text-gris sm:inline">{profil.prenom || profil.email}</span>
            <button type="submit" className="text-sm font-medium text-gris hover:text-rouge">
              Se déconnecter
            </button>
          </form>
        </div>
        <nav className="mx-auto flex w-full max-w-5xl gap-4 overflow-x-auto px-4 pb-3 md:hidden" aria-label="Navigation mobile">
          {liens.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap text-sm font-medium text-violet">
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
