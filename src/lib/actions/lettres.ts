"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerEquipe, texte } from "@/lib/auth";
import { lireLettre } from "@/lib/lettre";
import { createClient } from "@/lib/supabase/server";
import type { Resultat } from "./clientes";

function rafraichir() {
  revalidatePath("/coach", "layout");
  revalidatePath("/espace", "layout");
}

type Existant = { id: string; ordre: number; titre: string; slug: string | null };

// Les exercices suivent les titres de la lettre. Le slug reste : une note survit à une réécriture du texte.
async function synchroniserExercices(serieId: string, contenu: string) {
  const supabase = await createClient();
  const { chapitres } = lireLettre(contenu);
  const { data } = await supabase.from("pratiques").select("id, ordre, titre, slug").eq("serie_id", serieId).order("ordre").returns<Existant[]>();
  const existants = data ?? [];
  const identique = existants.length === chapitres.length && existants.every((e, i) => e.slug === chapitres[i].slug && e.titre === chapitres[i].titre);
  if (identique) return;
  await Promise.all(existants.map((e, i) => supabase.from("pratiques").update({ ordre: -1000 - i }).eq("id", e.id)));
  const gardes = new Set(chapitres.map((c) => c.slug));
  const retires = existants.filter((e) => !e.slug || !gardes.has(e.slug)).map((e) => e.id);
  if (retires.length) await supabase.from("pratiques").delete().in("id", retires);
  for (let i = 0; i < chapitres.length; i++) {
    const c = chapitres[i];
    const e = existants.find((x) => x.slug === c.slug);
    if (e) await supabase.from("pratiques").update({ ordre: i + 1, titre: c.titre }).eq("id", e.id);
    else await supabase.from("pratiques").insert({ serie_id: serieId, ordre: i + 1, titre: c.titre, slug: c.slug });
  }
}

// Ouvre un brouillon pour la prochaine lettre, ou reprend celui qui existe déjà.
export async function creerLettre(fd: FormData) {
  await exigerEquipe();
  const parcoursId = texte(fd, "parcours_id");
  const clienteId = texte(fd, "cliente_id");
  const seanceId = texte(fd, "seance_id") || null;
  const supabase = await createClient();
  let brouillons = supabase.from("pratiques_series").select("id").eq("parcours_id", parcoursId).is("publiee_at", null).order("created_at", { ascending: false }).limit(1);
  if (seanceId) brouillons = brouillons.eq("seance_id", seanceId);
  const { data: existant } = await brouillons.maybeSingle();
  if (existant) redirect(`/coach/clientes/${clienteId}/lettre/${existant.id}`);
  const { data: seances } = await supabase.from("seances").select("id, numero, statut").eq("parcours_id", parcoursId).order("numero", { ascending: false }).returns<{ id: string; numero: number; statut: string }[]>();
  const derniere = seanceId ? seances?.find((s) => s.id === seanceId) : seances?.find((s) => s.statut === "faite");
  const { data, error } = await supabase
    .from("pratiques_series")
    .insert({ parcours_id: parcoursId, seance_id: derniere?.id ?? null, titre: `Pour la séance ${(derniere?.numero ?? 0) + 1}` })
    .select("id")
    .single();
  if (error) throw error;
  rafraichir();
  redirect(`/coach/clientes/${clienteId}/lettre/${data.id}`);
}

export async function enregistrerLettre(id: string, titre: string, contenu: string): Promise<Resultat> {
  await exigerEquipe();
  const supabase = await createClient();
  const { error } = await supabase.from("pratiques_series").update({ titre: titre.trim(), contenu }).eq("id", id);
  if (error) return { ok: false, message: "Le brouillon n’a pas été enregistré." };
  await synchroniserExercices(id, contenu);
  rafraichir();
  return { ok: true };
}

// La lettre devient visible. Aucun email : Cloé prévient sur WhatsApp.
export async function envoyerLettre(id: string, titre: string, contenu: string): Promise<Resultat> {
  await exigerEquipe();
  if (!contenu.trim()) return { ok: false, message: "La lettre est vide." };
  const supabase = await createClient();
  const { error } = await supabase.from("pratiques_series").update({ titre: titre.trim(), contenu, publiee_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, message: "La lettre n’a pas été envoyée." };
  await synchroniserExercices(id, contenu);
  rafraichir();
  return { ok: true };
}

export async function retirerLettre(fd: FormData) {
  await exigerEquipe();
  const supabase = await createClient();
  await supabase.from("pratiques_series").update({ publiee_at: null }).eq("id", texte(fd, "id"));
  rafraichir();
}
