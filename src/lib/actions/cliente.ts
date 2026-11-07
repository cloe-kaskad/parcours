"use server";

import { revalidatePath } from "next/cache";
import { exigerCliente, texte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Resultat } from "./clientes";

export async function repondrePratique(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  const profil = await exigerCliente();
  const pratiqueId = texte(fd, "pratique_id");
  const contenu = String(fd.get("contenu") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase
    .from("reponses")
    .upsert({ pratique_id: pratiqueId, cliente_id: profil.id, contenu }, { onConflict: "pratique_id,cliente_id" });
  if (error) return { ok: false, message: "L’enregistrement n’a pas fonctionné. Réessaie dans un instant." };
  revalidatePath("/espace/exercices");
  return { ok: true, message: "Enregistré." };
}

export async function ecrireJournal(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  const profil = await exigerCliente();
  const contenu = String(fd.get("contenu") ?? "").trim();
  if (!contenu) return { ok: false, message: "L’entrée est vide." };
  const id = texte(fd, "id");
  const supabase = await createClient();
  const valeurs = {
    cliente_id: profil.id,
    date: texte(fd, "date") || new Date().toISOString().slice(0, 10),
    contenu,
    pour_prochaine_seance: fd.get("pour_prochaine_seance") === "on",
  };
  const { error } = id
    ? await supabase.from("journal").update(valeurs).eq("id", id).eq("cliente_id", profil.id)
    : await supabase.from("journal").insert(valeurs);
  if (error) return { ok: false, message: "L’enregistrement n’a pas fonctionné. Réessaie dans un instant." };
  revalidatePath("/espace/journal");
  revalidatePath("/espace");
  return { ok: true, message: id ? "Modifié." : "Ajouté au journal." };
}

export async function supprimerJournal(fd: FormData) {
  const profil = await exigerCliente();
  const supabase = await createClient();
  await supabase.from("journal").delete().eq("id", texte(fd, "id")).eq("cliente_id", profil.id);
  revalidatePath("/espace/journal");
}

export async function changerStatutRessource(fd: FormData) {
  const profil = await exigerCliente();
  const affectationId = texte(fd, "affectation_id");
  const statut = texte(fd, "statut");
  if (!["a_voir", "commence", "termine"].includes(statut)) return;
  const supabase = await createClient();
  await supabase
    .from("ressources_suivi")
    .upsert({ affectation_id: affectationId, cliente_id: profil.id, statut }, { onConflict: "affectation_id,cliente_id" });
  revalidatePath("/espace/ressources");
  revalidatePath("/espace");
}

// Météo du jour : un état parmi les 7, une note optionnelle. Une ligne par jour, modifiable.
export async function enregistrerMeteo(fd: FormData) {
  const profil = await exigerCliente();
  const etat = texte(fd, "etat_code");
  const note = String(fd.get("note") ?? "").trim().slice(0, 280);
  if (!etat) return;
  const supabase = await createClient();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
  await supabase
    .from("meteo")
    .upsert({ cliente_id: profil.id, date, etat_code: etat, note }, { onConflict: "cliente_id,date" });
  revalidatePath("/espace");
}
