import Link from "next/link";
import { Logo } from "./Logo";
import { OngletsCliente } from "./OngletsCliente";
import type { Profile } from "@/lib/supabase/types";

// Espace cliente : tout sur violet, cartes crème, onglets en bas sur mobile.
export function CoquilleCliente({ profil, children }: { profil: Profile; children: React.ReactNode }) {
  return (
    <div className="coquille-violette flex min-h-full flex-1 flex-col bg-violet text-creme">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 pb-2 pt-5 md:max-w-5xl md:pt-6">
        <Logo href="/espace" taille="sm" surViolet />
        <OngletsCliente prenom={profil.prenom || profil.email} />
      </header>
      <main className="avec-onglets mx-auto w-full max-w-3xl flex-1 px-5 pt-4 md:max-w-5xl">{children}</main>
    </div>
  );
}

const LIENS_COACH = [
  { href: "/coach", label: "À faire" },
  { href: "/coach/clientes", label: "Clientes" },
  { href: "/coach/ressources", label: "Bibliothèque" },
];

// Espace Cloé et Émilien : bandeau violet, zone de travail crème.
export function CoquilleCoach({ profil, children }: { profil: Profile; children: React.ReactNode }) {
  return (
    <div className="coquille-creme flex min-h-full flex-1 flex-col bg-creme text-encre">
      <header className="coquille-violette bg-violet text-creme">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Logo href="/coach" taille="sm" surViolet />
          <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Navigation">
            {LIENS_COACH.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium text-creme/85 transition hover:bg-white/10 hover:text-creme"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <form action="/auth/deconnexion" method="post" className="hidden items-center gap-3 sm:flex">
            <span className="text-sm text-creme/70">{profil.prenom || profil.email}</span>
            <button type="submit" className="text-sm text-creme/60 hover:text-rose">
              Quitter
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">{children}</main>
    </div>
  );
}
