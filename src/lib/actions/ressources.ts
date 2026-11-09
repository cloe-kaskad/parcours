"use server";

import { revalidatePath } from "next/cache";
import { exigerEquipe, texte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Resultat } from "./clientes";

function rafraichir() {
  revalidatePath("/coach", "layout");
  revalidatePath("/espace", "layout");
}
const ECHEC: Resultat = { ok: false, message: "Ça n’a pas été enregistré. Réessaie dans un instant." };

export async function creerRessource(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const titre = texte(fd, "titre");
  if (!titre) return { ok: false, message: "Le titre manque." };
  const supabase = await createClient();
  const { error } = await supabase.from("ressources").insert({
    type: texte(fd, "type") || "autre",
    titre,
    auteur: texte(fd, "auteur"),
    url: texte(fd, "url") || null,
    image_url: texte(fd, "image_url") || null,
    description: String(fd.get("description") ?? "").trim(),
  });
  if (error) return ECHEC;
  rafraichir();
  return { ok: true, message: "Enregistrée dans la bibliothèque." };
}

export async function modifierRessource(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const supabase = await createClient();
  const { error } = await supabase
    .from("ressources")
    .update({ type: texte(fd, "type") || "autre", titre: texte(fd, "titre"), auteur: texte(fd, "auteur"), description: String(fd.get("description") ?? "").trim() })
    .eq("id", texte(fd, "id"));
  if (error) return ECHEC;
  rafraichir();
  return { ok: true, message: "Enregistré." };
}

export async function validerProposition(fd: FormData) {
  await exigerEquipe();
  const supabase = await createClient();
  await supabase.from("ressources").update({ en_attente: false }).eq("id", texte(fd, "id"));
  rafraichir();
}

// Partage une ressource avec une cliente, avec le mot de Cloé.
export async function partagerRessource(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const parcoursId = texte(fd, "parcours_id");
  const ressourceId = texte(fd, "ressource_id");
  if (!parcoursId || !ressourceId) return { ok: false, message: "Choisis à qui et quoi partager." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("ressources_affectations")
    .upsert({ ressource_id: ressourceId, parcours_id: parcoursId, pourquoi: String(fd.get("pourquoi") ?? "").trim(), publiee_at: new Date().toISOString() }, { onConflict: "ressource_id,parcours_id" });
  if (error) return ECHEC;
  rafraichir();
  return { ok: true, message: "Partagée." };
}

export async function retirerPartage(fd: FormData) {
  await exigerEquipe();
  const supabase = await createClient();
  await supabase.from("ressources_affectations").delete().eq("id", texte(fd, "id"));
  rafraichir();
}
