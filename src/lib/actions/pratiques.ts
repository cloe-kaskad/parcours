"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerEquipe, texte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Resultat } from "./clientes";

function cheminsSerie(clienteId: string, serieId: string) {
  return [`/coach/clientes/${clienteId}`, `/coach/clientes/${clienteId}/pratiques/${serieId}`, "/espace/pratiques", "/espace", "/coach"];
}

export async function creerSerie(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const parcoursId = texte(fd, "parcours_id");
  const clienteId = texte(fd, "cliente_id");
  const seanceId = texte(fd, "seance_id") || null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pratiques_series")
    .insert({ parcours_id: parcoursId, seance_id: seanceId, titre: texte(fd, "titre") })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/coach/clientes/${clienteId}`);
  redirect(`/coach/clientes/${clienteId}/pratiques/${data.id}`);
}

export async function mettreAJourSerie(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const id = texte(fd, "id");
  const clienteId = texte(fd, "cliente_id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("pratiques_series")
    .update({
      titre: texte(fd, "titre"),
      intro: String(fd.get("intro") ?? ""),
      signature: texte(fd, "signature") || "Cloé",
      seance_id: texte(fd, "seance_id") || null,
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  cheminsSerie(clienteId, id).forEach((c) => revalidatePath(c));
  return { ok: true, message: "Enregistré." };
}

export async function publierSerie(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const id = texte(fd, "id");
  const clienteId = texte(fd, "cliente_id");
  const depublier = fd.get("depublier") === "1";
  const supabase = await createClient();
  const { error } = await supabase
    .from("pratiques_series")
    .update({ publiee_at: depublier ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  cheminsSerie(clienteId, id).forEach((c) => revalidatePath(c));
  return { ok: true, message: depublier ? "Série retirée de l'espace de la cliente." : "Série publiée, visible par la cliente." };
}

export async function ajouterPratique(fd: FormData) {
  await exigerEquipe();
  const serieId = texte(fd, "serie_id");
  const clienteId = texte(fd, "cliente_id");
  const supabase = await createClient();
  const { data: dernieres } = await supabase
    .from("pratiques")
    .select("ordre")
    .eq("serie_id", serieId)
    .order("ordre", { ascending: false })
    .limit(1);
  const ordre = ((dernieres?.[0]?.ordre as number | undefined) ?? 0) + 1;
  await supabase.from("pratiques").insert({ serie_id: serieId, ordre, titre: `Pratique ${ordre}` });
  cheminsSerie(clienteId, serieId).forEach((c) => revalidatePath(c));
}

export async function mettreAJourPratique(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const id = texte(fd, "id");
  const serieId = texte(fd, "serie_id");
  const clienteId = texte(fd, "cliente_id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("pratiques")
    .update({
      titre: texte(fd, "titre") || "Pratique",
      accroche: String(fd.get("accroche") ?? ""),
      consigne: String(fd.get("consigne") ?? ""),
      regles: String(fd.get("regles") ?? ""),
      pourquoi: String(fd.get("pourquoi") ?? ""),
      bonus: fd.get("bonus") === "on",
      ordre: Number(texte(fd, "ordre")) || 1,
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  cheminsSerie(clienteId, serieId).forEach((c) => revalidatePath(c));
  return { ok: true, message: "Pratique enregistrée." };
}

export async function supprimerPratique(fd: FormData) {
  await exigerEquipe();
  const id = texte(fd, "id");
  const serieId = texte(fd, "serie_id");
  const clienteId = texte(fd, "cliente_id");
  const supabase = await createClient();
  await supabase.from("pratiques").delete().eq("id", id);
  cheminsSerie(clienteId, serieId).forEach((c) => revalidatePath(c));
}

export async function supprimerSerie(fd: FormData) {
  await exigerEquipe();
  const id = texte(fd, "id");
  const clienteId = texte(fd, "cliente_id");
  const supabase = await createClient();
  await supabase.from("pratiques_series").delete().eq("id", id);
  revalidatePath(`/coach/clientes/${clienteId}`);
  redirect(`/coach/clientes/${clienteId}`);
}
