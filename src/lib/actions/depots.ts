"use server";

import { randomUUID } from "node:crypto";
import { exigerEquipe } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

const GENRES = {
  audio: { bucket: "audio", extensions: ["mp3", "m4a", "wav", "aac", "ogg", "webm", "mp4"] },
  pdf: { bucket: "transcripts", extensions: ["pdf"] },
  couverture: { bucket: "couvertures", extensions: ["jpg", "jpeg", "png", "webp"] },
  note: { bucket: "notes", extensions: ["pdf"] },
} as const;

export type GenreDepot = keyof typeof GENRES;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// URL d'envoi signée : le fichier part du navigateur vers Storage, sans passer par le serveur.
export async function creerDepot(genre: GenreDepot, cible: string, nomFichier: string) {
  await exigerEquipe();
  const config = GENRES[genre];
  const extension = nomFichier.split(".").pop()?.toLowerCase() ?? "";
  if (!config || !UUID.test(cible) || !(config.extensions as readonly string[]).includes(extension)) {
    return { ok: false as const, message: "Ce type de fichier n’est pas accepté." };
  }
  const chemin = `${cible}/${randomUUID()}.${extension}`;
  const service = createServiceClient();
  const { data, error } = await service.storage.from(config.bucket).createSignedUploadUrl(chemin);
  if (error || !data) return { ok: false as const, message: "Le dépôt n’a pas pu démarrer. Réessaie dans un instant." };
  return { ok: true as const, bucket: config.bucket, chemin, token: data.token };
}
