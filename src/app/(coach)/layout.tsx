import type { Viewport } from "next";
import { redirect } from "next/navigation";
import { chargerSelecteur } from "@/lib/db/coach";
import { getProfil } from "@/lib/supabase/server";

export const viewport: Viewport = { themeColor: "#59114D" };

export default async function LayoutCoach({ children }: { children: React.ReactNode }) {
  const profil = await getProfil();
  if (!profil) redirect("/connexion");
  if (profil.role === "cliente") redirect("/espace");
  // L'en-tête (sélecteur de clientes) se charge dès maintenant, en même temps que la page :
  // le composant Barre retrouvera ce même chargement (mis en cache pour la requête).
  void chargerSelecteur(profil.role === "coach");
  return <main className="flex min-h-full flex-1 flex-col bg-violet">{children}</main>;
}
