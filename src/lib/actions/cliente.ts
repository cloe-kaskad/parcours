"use server";

import { revalidatePath } from "next/cache";
import { exigerCliente, texte } from "@/lib/auth";
import { aujourdhuiParis } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Resultat } from "./clientes";

// Un seul carnet : entrée libre, note sous un exercice, ou modification d'une note.
export async function ecrireCarnet(fd: FormData): Promise<Resultat> {
  const profil = await exigerCliente();
  const contenu = String(fd.get("contenu") ?? "").trim();
  if (!contenu) return { ok: false, message: "Il n’y a encore rien d’écrit." };
  const id = texte(fd, "id");
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("journal").update({ contenu }).eq("id", id).eq("cliente_id", profil.id)
    : await supabase.from("journal").insert({
        cliente_id: profil.id,
        date: aujourdhuiParis(),
        contenu,
        pour_prochaine_seance: fd.get("a_aborder") === "on",
        pratique_id: texte(fd, "pratique_id") || null,
        serie_id: texte(fd, "serie_id") || null,
      });
  if (error) return { ok: false, message: "Ça n’a pas été gardé. Réessaie dans un instant." };
  revalidatePath("/espace", "layout");
  return { ok: true, message: "Gardé." };
}

// Le marqueur « à aborder en séance », sur n'importe quelle entrée.
export async function marquerAAborder(id: string, valeur: boolean) {
  const profil = await exigerCliente();
  const supabase = await createClient();
  await supabase.from("journal").update({ pour_prochaine_seance: valeur }).eq("id", id).eq("cliente_id", profil.id);
  revalidatePath("/espace", "layout");
}

export async function changerSuiviRessource(affectationId: string, statut: "a_voir" | "commence" | "termine") {
  const profil = await exigerCliente();
  const supabase = await createClient();
  await supabase
    .from("ressources_suivi")
    .upsert({ affectation_id: affectationId, cliente_id: profil.id, statut }, { onConflict: "affectation_id,cliente_id" });
  revalidatePath("/espace", "layout");
}

// Météo du jour : un état parmi les 7, un mot facultatif. Une ligne par jour, modifiable.
export async function enregistrerMeteo(fd: FormData) {
  const profil = await exigerCliente();
  const etat = texte(fd, "etat_code");
  const note = String(fd.get("note") ?? "").trim().slice(0, 280);
  if (!etat) return;
  const supabase = await createClient();
  await supabase
    .from("meteo")
    .upsert({ cliente_id: profil.id, date: aujourdhuiParis(), etat_code: etat, note }, { onConflict: "cliente_id,date" });
  revalidatePath("/espace", "layout");
}

// Un vocal de la cliente (une minute au plus) : déposé dans son dossier de l'espace « vocaux »,
// transcrit par Deepgram, rangé dans son carnet comme une entrée (migration 0007).
export async function vocalDepose(chemin: string, duree: number): Promise<Resultat> {
  const profil = await exigerCliente();
  if (!chemin.startsWith(`${profil.id}/`)) return { ok: false, message: "Ce vocal n’a pas été gardé." };
  const supabase = await createClient();
  let texteVocal = "";
  const cle = process.env.DEEPGRAM_API_KEY?.trim();
  const { data: signe } = await supabase.storage.from("vocaux").createSignedUrl(chemin, 600);
  if (cle && signe?.signedUrl) {
    try {
      const r = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&language=fr&punctuate=true&smart_format=true", {
        method: "POST",
        headers: { Authorization: `Token ${cle}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: signe.signedUrl }),
      });
      const j = (await r.json()) as { results?: { channels?: { alternatives?: { transcript?: string }[] }[] } };
      texteVocal = j.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
    } catch (e) {
      console.error("Transcription du vocal", e instanceof Error ? e.message : e);
    }
  }
  const { error } = await supabase.from("journal").insert({
    cliente_id: profil.id,
    date: aujourdhuiParis(),
    contenu: texteVocal || "(un vocal)",
    audio_path: chemin,
    audio_duree_sec: Math.max(1, Math.min(90, Math.round(duree))),
  });
  if (error) return { ok: false, message: "Ton vocal n’a pas été gardé. Réessaie dans un instant." };
  revalidatePath("/espace", "layout");
  return { ok: true, message: texteVocal ? "Gardé, et écrit dans ton carnet." : "Gardé dans ton carnet." };
}
