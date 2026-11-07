import "server-only";
import { redirect } from "next/navigation";
import { getProfil } from "./supabase/server";
import type { Profile } from "./supabase/types";

// Garde pour les actions et pages réservées à Cloé et Émilien.
export async function exigerEquipe(): Promise<Profile> {
  const profil = await getProfil();
  if (!profil) redirect("/connexion");
  if (profil.role === "cliente") redirect("/espace");
  return profil;
}

export async function exigerCliente(): Promise<Profile> {
  const profil = await getProfil();
  if (!profil) redirect("/connexion");
  if (profil.role !== "cliente") redirect("/coach");
  return profil;
}

export function texte(fd: FormData, cle: string) {
  return String(fd.get(cle) ?? "").trim();
}
