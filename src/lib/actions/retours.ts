"use server";

import { revalidatePath } from "next/cache";
import { RetourEmilienEnvoye } from "@/emails/RetourEmilienEnvoye";
import { getProfil } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { envoyerUneFois } from "@/lib/emails";
import { exigerEquipe, texte } from "@/lib/auth";
import { lireLien } from "@/lib/lien";
import { analyserRetour } from "@/lib/transcription/analyse";
import { convertirWord, sansImages, telechargerGoogleDoc, type Conversion } from "@/lib/retour-document";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Profile } from "@/lib/supabase/types";
import type { Resultat } from "./clientes";

type Saisie = { seanceId: string; contenu: string; url: string; mot: string };

async function exigerRelecteur(): Promise<Profile> {
  const profil = await getProfil();
  if (!profil) redirect("/connexion");
  if (profil.role !== "relecteur") redirect("/coach");
  return profil;
}

function rafraichir() {
  revalidatePath("/emilien", "layout");
  revalidatePath("/coach", "layout");
}

// Une seule ligne de retour par séance et par relecteur.
async function ecrire(profil: Profile, { seanceId, contenu, url, mot }: Saisie, envoye: boolean) {
  const supabase = await createClient();
  const { data: existant } = await supabase.from("retours").select("id, envoye_at").eq("seance_id", seanceId).eq("auteur_id", profil.id).maybeSingle();
  const valeurs = {
    contenu: contenu.trim(),
    ressource_proposee_url: url.trim() || null,
    ressource_proposee_mot: mot.trim() || null,
    envoye_at: existant?.envoye_at ?? (envoye ? new Date().toISOString() : null),
  };
  const { error } = existant ? await supabase.from("retours").update(valeurs).eq("id", existant.id) : await supabase.from("retours").insert({ seance_id: seanceId, auteur_id: profil.id, ...valeurs });
  if (error) return null;
  const id = existant?.id ?? (await supabase.from("retours").select("id").eq("seance_id", seanceId).eq("auteur_id", profil.id).single()).data?.id;
  return id ? { id: id as string, premierEnvoi: envoye && !existant?.envoye_at } : null;
}

export async function enregistrerRetour(saisie: Saisie): Promise<Resultat> {
  const profil = await exigerRelecteur();
  const r = await ecrire(profil, saisie, false);
  if (!r) return { ok: false, message: "Ça n’a pas été enregistré. Réessaie dans un instant." };
  rafraichir();
  return { ok: true, message: "Enregistré." };
}

// La ressource proposée arrive dans la bibliothèque de Cloé, en attente.
async function proposerRessource(url: string, mot: string) {
  if (!url.trim()) return;
  const supabase = await createClient();
  const { data: deja } = await supabase.from("ressources").select("id").eq("url", url.trim()).maybeSingle();
  if (deja) return;
  const infos = await lireLien(url).catch(() => null);
  await supabase.from("ressources").insert({
    type: infos?.type ?? "autre",
    titre: infos?.titre ?? url.trim(),
    auteur: infos?.auteur ?? "",
    url: url.trim(),
    image_url: infos?.image ?? null,
    description: mot.trim() || infos?.description || "",
    source: "emilien",
    en_attente: true,
  });
}

export async function envoyerRetour(saisie: Saisie): Promise<Resultat> {
  const profil = await exigerRelecteur();
  if (!saisie.contenu.trim()) return { ok: false, message: "Ton retour est vide." };
  const r = await ecrire(profil, saisie, true);
  if (!r) return { ok: false, message: "Ton retour n’a pas été envoyé. Réessaie dans un instant." };
  await proposerRessource(saisie.url, saisie.mot);
  await proposer(r.id, saisie.contenu);
  if (r.premierEnvoi) {
    const service = createServiceClient();
    const { data: seance } = await service.from("seances").select("numero, parcours(cliente_id, profiles(prenom))").eq("id", saisie.seanceId).single();
    const { data: coach } = await service.from("profiles").select("email").eq("role", "coach").limit(1).single();
    const parcours = seance?.parcours as unknown as { cliente_id: string; profiles: { prenom: string } } | null;
    if (seance && parcours && coach) {
      await envoyerUneFois({
        type: "retour_emilien",
        destinataire: coach.email,
        seanceId: saisie.seanceId,
        sujet: `${parcours.profiles.prenom}, séance ${seance.numero} : le retour d’Émilien est là`,
        corps: RetourEmilienEnvoye({ prenom: parcours.profiles.prenom, numero: seance.numero, clienteId: parcours.cliente_id, seanceId: saisie.seanceId }),
      });
    }
  }
  rafraichir();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Retour écrit dans Word ou Google Docs : converti en texte, images comprises.
// Le texte revient dans le champ d'Émilien ; il relit, puis enregistre ou envoie.
// ---------------------------------------------------------------------------
export async function importerDocument(seanceId: string, chemin: string): Promise<Conversion> {
  await exigerRelecteur();
  if (!chemin.startsWith(`imports/${seanceId}/`) || chemin.includes("..")) return { ok: false, message: "Ce fichier est introuvable." };
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("retours").download(chemin);
  if (error || !data) return { ok: false, message: "Le document n’a pas pu être récupéré. Réessaie dans un instant." };
  return convertirWord(supabase, seanceId, Buffer.from(await data.arrayBuffer()));
}

export async function importerGoogleDoc(seanceId: string, lien: string): Promise<Conversion> {
  await exigerRelecteur();
  const doc = await telechargerGoogleDoc(lien.trim());
  if (!doc.ok) return doc;
  return convertirWord(await createClient(), seanceId, doc.octets);
}

// ---------------------------------------------------------------------------
// Phrase clé et trois points (migration 0006) : proposés depuis le retour,
// validés par Cloé ou Émilien. Même mécanique que les trois mots d'une séance.
// ---------------------------------------------------------------------------
const ECHEC: Resultat = { ok: false, message: "Ça n’a pas été enregistré. Réessaie dans un instant." };

// Lit le retour et enregistre une proposition. Silencieux en cas d'échec (le retour est déjà envoyé).
async function proposer(retourId: string, contenu: string) {
  const analyse = await analyserRetour(sansImages(contenu));
  if (!analyse) return false;
  const supabase = await createClient();
  const { error } = await supabase.from("retours").update({ phrase_cle_proposee: analyse.phrase, points_cles_proposes: analyse.points }).eq("id", retourId);
  if (error) console.error("Phrase clé proposée", error.message);
  return !error;
}

export async function proposerPhraseCle(retourId: string): Promise<Resultat> {
  await exigerEquipe();
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return { ok: false, message: "La lecture automatique n’est pas branchée : la clé Anthropic manque dans Vercel." };
  const supabase = await createClient();
  const { data: r } = await supabase.from("retours").select("contenu, contenu_lisible").eq("id", retourId).single();
  if (!r?.contenu?.trim()) return { ok: false, message: "Ce retour est vide." };
  const ok = await proposer(retourId, (r.contenu_lisible as string | null)?.trim() || (r.contenu as string));
  if (!ok) return { ok: false, message: "La proposition n’a pas pu être faite. Réessaie dans un instant." };
  revalidatePath("/coach", "layout");
  revalidatePath("/emilien", "layout");
  return { ok: true, message: "Proposé : relis, corrige si besoin, puis valide." };
}

export async function validerPhraseCle(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const points = [texte(fd, "point1"), texte(fd, "point2"), texte(fd, "point3")].filter(Boolean);
  const supabase = await createClient();
  const { error } = await supabase.from("retours").update({ phrase_cle: texte(fd, "phrase") || null, points_cles: points }).eq("id", texte(fd, "id"));
  if (error) return ECHEC;
  revalidatePath("/coach", "layout");
  revalidatePath("/emilien", "layout");
  return { ok: true, message: "Validé." };
}
