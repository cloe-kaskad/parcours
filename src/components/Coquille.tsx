import { Logo } from "./Logo";
import { OngletsCliente } from "./OngletsCliente";
import { OngletsCoach } from "./OngletsCoach";
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

// Espace Cloé et Émilien : bandeau violet, zone de travail crème.
export function CoquilleCoach({ profil, children }: { profil: Profile; children: React.ReactNode }) {
  return (
    <div className="coquille-creme flex min-h-full flex-1 flex-col bg-creme text-encre">
      <header className="coquille-violette bg-violet text-creme">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Logo href="/coach" taille="sm" surViolet />
          <OngletsCoach prenom={profil.prenom || profil.email} />
        </div>
      </header>
      <main className="avec-onglets mx-auto w-full max-w-6xl flex-1 px-5 pt-8">{children}</main>
    </div>
  );
}
