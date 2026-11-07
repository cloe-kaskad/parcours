"use server";

import { revalidatePath } from "next/cache";
import { exigerEquipe, texte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Resultat } from "./clientes";

export async function creerRessource(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const titre = texte(fd, "titre");
  if (!titre) return { ok: false, message: "Le titre est obligatoire." };
  const supabase = await createClient();
  const { error } = await supabase.from("ressources").insert({
    type: texte(fd, "type") || "autre",
    titre,
    auteur: texte(fd, "auteur"),
    url: texte(fd, "url") || null,
    description: String(fd.get("description") ?? ""),
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/coach/ressources");
  return { ok: true, message: "Ressource ajoutée." };
}

export async function mettreAJourRessource(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const id = texte(fd, "id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("ressources")
    .update({
      type: texte(fd, "type") || "autre",
      titre: texte(fd, "titre"),
      auteur: texte(fd, "auteur"),
      url: texte(fd, "url") || null,
      description: String(fd.get("description") ?? ""),
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/coach/ressources");
  revalidatePath("/espace/ressources");
  return { ok: true, message: "Enregistré." };
}

export async function supprimerRessource(fd: FormData) {
  await exigerEquipe();
  const supabase = await createClient();
  await supabase.from("ressources").delete().eq("id", texte(fd, "id"));
  revalidatePath("/coach/ressources");
}

// Affecte une ressource de la bibliothèque à une cliente, avec le « pourquoi » personnalisé. Publiée immédiatement.
export async function affecterRessource(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const parcoursId = texte(fd, "parcours_id");
  const clienteId = texte(fd, "cliente_id");
  const ressourceId = texte(fd, "ressource_id");
  if (!ressourceId) return { ok: false, message: "Choisis une ressource." };
  const supabase = await createClient();
  const { error } = await supabase.from("ressources_affectations").upsert(
    {
      ressource_id: ressourceId,
      parcours_id: parcoursId,
      seance_id: texte(fd, "seance_id") || null,
      pourquoi: String(fd.get("pourquoi") ?? ""),
      publiee_at: new Date().toISOString(),
    },
    { onConflict: "ressource_id,parcours_id" },
  );
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/coach/clientes/${clienteId}`);
  revalidatePath("/espace/ressources");
  return { ok: true, message: "Ressource partagée avec la cliente." };
}

export async function retirerAffectation(fd: FormData) {
  await exigerEquipe();
  const clienteId = texte(fd, "cliente_id");
  const supabase = await createClient();
  await supabase.from("ressources_affectations").delete().eq("id", texte(fd, "id"));
  revalidatePath(`/coach/clientes/${clienteId}`);
  revalidatePath("/espace/ressources");
}
