"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerEquipe, texte } from "@/lib/auth";
import { depuisInputDateHeure } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Resultat } from "./clientes";

export async function creerSeance(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const parcoursId = texte(fd, "parcours_id");
  const clienteId = texte(fd, "cliente_id");
  const supabase = await createClient();

  const { data: dernieres } = await supabase
    .from("seances")
    .select("numero")
    .eq("parcours_id", parcoursId)
    .order("numero", { ascending: false })
    .limit(1);
  const numero = Number(texte(fd, "numero")) || ((dernieres?.[0]?.numero as number | undefined) ?? 0) + 1;

  const { data, error } = await supabase
    .from("seances")
    .insert({
      parcours_id: parcoursId,
      numero,
      date: depuisInputDateHeure(texte(fd, "date")),
      statut: texte(fd, "statut") || "planifiee",
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/coach/clientes/${clienteId}`);
  redirect(`/coach/clientes/${clienteId}/seances/${data.id}`);
}

export async function mettreAJourSeance(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const id = texte(fd, "id");
  const clienteId = texte(fd, "cliente_id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("seances")
    .update({
      numero: Number(texte(fd, "numero")) || 1,
      date: depuisInputDateHeure(texte(fd, "date")),
      duree_min: Number(texte(fd, "duree_min")) || 90,
      statut: texte(fd, "statut") || "planifiee",
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/coach/clientes/${clienteId}`);
  revalidatePath(`/coach/clientes/${clienteId}/seances/${id}`);
  return { ok: true, message: "Enregistré." };
}

export async function enregistrerTranscript(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const id = texte(fd, "id");
  const clienteId = texte(fd, "cliente_id");
  const transcript = String(fd.get("transcript_formate") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("seances")
    .update({ transcript_formate: transcript, transcript_statut: transcript.trim() ? "pret" : "aucun" })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/coach/clientes/${clienteId}/seances/${id}`);
  return { ok: true, message: "Transcript enregistré." };
}

// Dépose un PDF de transcript (fichier existant, par exemple issu de Notion ou du Drive).
export async function deposerTranscriptPdf(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const id = texte(fd, "id");
  const clienteId = texte(fd, "cliente_id");
  const parcoursId = texte(fd, "parcours_id");
  const fichier = fd.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) return { ok: false, message: "Choisis un fichier PDF." };
  if (fichier.type !== "application/pdf") return { ok: false, message: "Le fichier doit être un PDF." };
  if (fichier.size > 4 * 1024 * 1024) {
    return { ok: false, message: "Le fichier dépasse 4 Mo. Compresse-le (Aperçu > Exporter > réduire la taille) ou colle le texte ci-dessous." };
  }

  const service = createServiceClient();
  const chemin = `${parcoursId}/${id}/transcript.pdf`;
  const { error } = await service.storage
    .from("transcripts")
    .upload(chemin, fichier, { contentType: "application/pdf", upsert: true });
  if (error) return { ok: false, message: `Dépôt impossible : ${error.message}` };

  const { error: errMaj } = await service
    .from("seances")
    .update({ transcript_pdf_path: chemin, transcript_statut: "pret" })
    .eq("id", id);
  if (errMaj) return { ok: false, message: errMaj.message };
  revalidatePath(`/coach/clientes/${clienteId}/seances/${id}`);
  return { ok: true, message: "PDF déposé." };
}

export async function marquerEnvoyeEmilien(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const id = texte(fd, "id");
  const clienteId = texte(fd, "cliente_id");
  const supabase = await createClient();
  const { error } = await supabase.from("seances").update({ envoye_emilien_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/coach/clientes/${clienteId}/seances/${id}`);
  revalidatePath("/coach");
  return { ok: true, message: "Noté comme transmis à Émilien." };
}

export async function ajouterRetour(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  const profil = await exigerEquipe();
  const seanceId = texte(fd, "seance_id");
  const clienteId = texte(fd, "cliente_id");
  const contenu = String(fd.get("contenu") ?? "").trim();
  if (!contenu) return { ok: false, message: "Le retour est vide." };
  const supabase = await createClient();
  const { error } = await supabase.from("retours").insert({ seance_id: seanceId, auteur_id: profil.id, contenu });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/coach/clientes/${clienteId}/seances/${seanceId}`);
  return { ok: true, message: "Retour ajouté." };
}

export async function supprimerSeance(fd: FormData) {
  await exigerEquipe();
  const id = texte(fd, "id");
  const clienteId = texte(fd, "cliente_id");
  const supabase = await createClient();
  await supabase.from("seances").delete().eq("id", id);
  revalidatePath(`/coach/clientes/${clienteId}`);
  redirect(`/coach/clientes/${clienteId}`);
}
