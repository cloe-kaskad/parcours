"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerCoach, texte } from "@/lib/auth";
import { depuisInputDateHeure } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Resultat } from "./clientes";

function rafraichir() {
  revalidatePath("/coach", "layout");
  revalidatePath("/espace", "layout");
}
const ECHEC: Resultat = { ok: false, message: "Ça n’a pas été enregistré. Réessaie dans un instant." };

export async function creerSeance(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerCoach();
  const parcoursId = texte(fd, "parcours_id");
  if (!parcoursId) return { ok: false, message: "Choisis une cliente." };
  const supabase = await createClient();
  const { data: parcours } = await supabase.from("parcours").select("cliente_id").eq("id", parcoursId).single();
  const { data: dernieres } = await supabase.from("seances").select("numero").eq("parcours_id", parcoursId).order("numero", { ascending: false }).limit(1);
  const { data, error } = await supabase
    .from("seances")
    .insert({ parcours_id: parcoursId, numero: ((dernieres?.[0]?.numero as number | undefined) ?? 0) + 1, date: depuisInputDateHeure(texte(fd, "date")), statut: "planifiee" })
    .select("id")
    .single();
  if (error || !parcours) return ECHEC;
  rafraichir();
  redirect(`/coach/clientes/${parcours.cliente_id}/seances/${data.id}`);
}

export async function enregistrerDate(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerCoach();
  const date = depuisInputDateHeure(texte(fd, "date"));
  if (!date) return { ok: false, message: "Choisis une date." };
  const supabase = await createClient();
  const { error } = await supabase.from("seances").update({ date }).eq("id", texte(fd, "id"));
  if (error) return ECHEC;
  rafraichir();
  return { ok: true, message: "Date enregistrée." };
}

export async function modifierSeance(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerCoach();
  const supabase = await createClient();
  const { error } = await supabase
    .from("seances")
    .update({ date: depuisInputDateHeure(texte(fd, "date")), statut: fd.get("faite") === "on" ? "faite" : "planifiee" })
    .eq("id", texte(fd, "id"));
  if (error) return ECHEC;
  rafraichir();
  return { ok: true, message: "Enregistré." };
}

export async function audioDepose(seanceId: string, chemin: string, duree: number | null): Promise<Resultat> {
  await exigerCoach();
  const supabase = await createClient();
  const { error } = await supabase.from("seances").update({ audio_path: chemin, audio_source: "depot", audio_duree_sec: duree }).eq("id", seanceId);
  if (error) return ECHEC;
  rafraichir();
  return { ok: true, message: "Audio déposé." };
}

export async function pdfTranscriptDepose(seanceId: string, chemin: string): Promise<Resultat> {
  await exigerCoach();
  const supabase = await createClient();
  const { error } = await supabase.from("seances").update({ transcript_pdf_path: chemin, transcript_statut: "pret" }).eq("id", seanceId);
  if (error) return ECHEC;
  rafraichir();
  return { ok: true, message: "PDF déposé." };
}

export async function enregistrerTranscript(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerCoach();
  const contenu = String(fd.get("transcript") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("seances").update({ transcript_formate: contenu, transcript_statut: contenu.trim() ? "pret" : "aucun" }).eq("id", texte(fd, "id"));
  if (error) return ECHEC;
  rafraichir();
  return { ok: true, message: "Transcript enregistré." };
}

export async function validerMots(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerCoach();
  const mots = [texte(fd, "mot1"), texte(fd, "mot2"), texte(fd, "mot3")].filter(Boolean);
  const supabase = await createClient();
  const { error } = await supabase.from("seances").update({ mots_cles: mots, station_validee: texte(fd, "station") || null }).eq("id", texte(fd, "id"));
  if (error) return ECHEC;
  rafraichir();
  return { ok: true, message: "Validé, sur le chemin." };
}

// Corrige les noms de stations du chemin, en place sur la fiche.
export async function enregistrerChemin(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerCoach();
  const supabase = await createClient();
  const stations = [...fd.entries()].filter(([cle]) => cle.startsWith("station_"));
  const resultats = await Promise.all(stations.map(([cle, valeur]) => supabase.from("seances").update({ station_validee: String(valeur).trim() || null }).eq("id", cle.slice(8))));
  if (resultats.some((r) => r.error)) return ECHEC;
  rafraichir();
  return { ok: true, message: "Chemin enregistré." };
}

export async function noterEmilienPrevenu(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerCoach();
  const supabase = await createClient();
  const { error } = await supabase.from("seances").update({ emilien_notifie_at: new Date().toISOString() }).eq("id", texte(fd, "id"));
  if (error) return ECHEC;
  rafraichir();
  return { ok: true, message: "Noté." };
}

// « Ma préparation » : Cloé seule, ni la cliente, ni Émilien.
export async function enregistrerPreparation(seanceId: string, contenu: string): Promise<Resultat> {
  await exigerCoach();
  const supabase = await createClient();
  const { error } = await supabase.from("seances_preparations").upsert({ seance_id: seanceId, contenu }, { onConflict: "seance_id" });
  if (error) return ECHEC;
  return { ok: true };
}
