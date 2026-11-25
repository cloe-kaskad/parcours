import "server-only";

import mammoth from "mammoth";
import TurndownService from "turndown";
import type { SupabaseClient } from "@supabase/supabase-js";

// Un retour d'Émilien écrit dans Word ou Google Docs devient du texte Markdown :
// les mots, les titres, le gras, l'italique, les listes et les liens restent ;
// chaque image est rangée dans l'espace privé « retours » et reprise à sa place,
// servie par /api/fichier (équipe seulement, jamais une cliente).

export const TYPE_WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const IMAGES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" };
const TAILLE_MAX = 50 * 1024 * 1024;

export type Conversion = { ok: true; texte: string; images: number; oubliees: number } | { ok: false; message: string };

// Un fichier Word est une archive zip : il commence par « PK ».
const estUnWord = (octets: Buffer) => octets.length > 4 && octets[0] === 0x50 && octets[1] === 0x4b;

export const lienImage = (chemin: string) => `/api/fichier?b=retours&p=${encodeURIComponent(chemin)}`;

export async function convertirWord(supabase: SupabaseClient, seanceId: string, octets: Buffer): Promise<Conversion> {
  if (!estUnWord(octets)) return { ok: false, message: "Ce fichier n’est pas un document Word (.docx)." };
  if (octets.length > TAILLE_MAX) return { ok: false, message: "Ce document dépasse 50 Mo." };

  const lot = crypto.randomUUID().slice(0, 8);
  let images = 0;
  let oubliees = 0;
  const html = await mammoth
    .convertToHtml(
      { buffer: octets },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const ext = IMAGES[image.contentType];
          if (!ext) {
            oubliees++;
            return { src: "" };
          }
          const chemin = `images/${seanceId}/${lot}-${++images}.${ext}`;
          const { error } = await supabase.storage.from("retours").upload(chemin, await image.readAsBuffer(), { contentType: image.contentType, upsert: true });
          if (error) {
            console.error("Image du retour", error.message);
            images--;
            oubliees++;
            return { src: "" };
          }
          return { src: lienImage(chemin) };
        }),
      },
    )
    .then((r) => r.value)
    .catch((e: unknown) => {
      console.error("Lecture du document", e);
      return null;
    });
  if (html === null) return { ok: false, message: "Ce document n’a pas pu être lu. Enregistre-le de nouveau en .docx, puis réessaie." };

  const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", emDelimiter: "*" });
  // Une image qu'on n'a pas pu reprendre disparaît plutôt que de laisser un cadre vide.
  turndown.addRule("image", {
    filter: "img",
    replacement: (_, noeud) => {
      const el = noeud as HTMLImageElement;
      const src = el.getAttribute("src");
      return src ? `\n\n![${(el.getAttribute("alt") ?? "").replace(/[\[\]\n]/g, " ").trim()}](${src})\n\n` : "";
    },
  });
  const texte = turndown
    .turndown(html)
    .replace(/ /g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!texte) return { ok: false, message: "Ce document est vide." };
  return { ok: true, texte, images, oubliees };
}

// Un lien Google Docs : on récupère le document au format Word, s'il est partagé par lien.
export async function telechargerGoogleDoc(lien: string): Promise<{ ok: true; octets: Buffer } | { ok: false; message: string }> {
  const id = lien.match(/docs\.google\.com\/document\/(?:u\/\d+\/)?d\/([\w-]{20,})/)?.[1];
  if (!id) return { ok: false, message: "Ce lien n’est pas celui d’un Google Doc. Il commence par docs.google.com/document/d/…" };
  const reponse = await fetch(`https://docs.google.com/document/d/${id}/export?format=docx`, { redirect: "follow", signal: AbortSignal.timeout(30_000) }).catch(() => null);
  const octets = reponse?.ok ? Buffer.from(await reponse.arrayBuffer()) : null;
  if (!octets || !estUnWord(octets)) {
    return { ok: false, message: "Ce Google Doc n’est pas ouvert à qui a le lien. Dans Google Docs : Partager, puis « Tous les utilisateurs disposant du lien ». Ou bien : Fichier, Télécharger, Microsoft Word, et dépose le fichier ici." };
  }
  return { ok: true, octets };
}

// Pour la lecture automatique (phrase clé) : le texte sans les images.
export const sansImages = (texte: string) => texte.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\n{3,}/g, "\n\n");
