"use server";

import { revalidatePath } from "next/cache";
import { exigerEquipe, texte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Resultat } from "./clientes";

function motsCles(fd: FormData) {
  return texte(fd, "mots_cles")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

function rafraichir(clienteId: string) {
  revalidatePath(`/coach/clientes/${clienteId}`);
  revalidatePath("/espace/chemin");
  revalidatePath("/espace");
}

export async function creerEtape(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const parcoursId = texte(fd, "parcours_id");
  const clienteId = texte(fd, "cliente_id");
  const titre = texte(fd, "titre");
  if (!titre) return { ok: false, message: "Donne un titre à l'étape." };
  const supabase = await createClient();
  const { data: dernieres } = await supabase.from("etapes").select("ordre").eq("parcours_id", parcoursId).order("ordre", { ascending: false }).limit(1);
  const ordre = ((dernieres?.[0]?.ordre as number | undefined) ?? 0) + 1;
  const { error } = await supabase.from("etapes").insert({
    parcours_id: parcoursId,
    ordre,
    titre,
    mots_cles: motsCles(fd),
    moments_forts: String(fd.get("moments_forts") ?? ""),
    statut: texte(fd, "statut") || "a_venir",
  });
  if (error) return { ok: false, message: error.message };
  rafraichir(clienteId);
  return { ok: true, message: "Étape ajoutée au chemin." };
}

export async function mettreAJourEtape(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const id = texte(fd, "id");
  const clienteId = texte(fd, "cliente_id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("etapes")
    .update({
      titre: texte(fd, "titre") || "Étape",
      ordre: Number(texte(fd, "ordre")) || 1,
      mots_cles: motsCles(fd),
      moments_forts: String(fd.get("moments_forts") ?? ""),
      statut: texte(fd, "statut") || "a_venir",
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  rafraichir(clienteId);
  return { ok: true, message: "Étape enregistrée." };
}

export async function supprimerEtape(fd: FormData) {
  await exigerEquipe();
  const clienteId = texte(fd, "cliente_id");
  const supabase = await createClient();
  await supabase.from("etapes").delete().eq("id", texte(fd, "id"));
  rafraichir(clienteId);
}
