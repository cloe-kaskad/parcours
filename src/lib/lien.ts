import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { RessourceType } from "@/lib/supabase/types";

export type InfosLien = { url: string; type: RessourceType; titre: string; auteur: string; description: string; image: string | null };

const DELAI_MS = 5000;
const TAILLE_MAX = 1_000_000;

function adressePrivee(ip: string) {
  if (ip === "::1" || ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) return true;
  const v4 = ip.replace(/^::ffff:/, "");
  if (isIP(v4) !== 4) return false;
  const [a, b] = v4.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

// On ne va chercher que des pages publiques : jamais une adresse interne.
async function urlAutorisee(brut: string) {
  let url: URL;
  try {
    url = new URL(brut);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const hote = url.hostname.replace(/^\[|\]$/g, "");
  if (hote === "localhost" || hote.endsWith(".local") || hote.endsWith(".internal")) return null;
  try {
    const adresses = isIP(hote) ? [{ address: hote }] : await lookup(hote, { all: true });
    if (adresses.some((a) => adressePrivee(a.address))) return null;
  } catch {
    return null;
  }
  return url;
}

async function telecharger(depart: URL, signal: AbortSignal) {
  let url = depart;
  for (let saut = 0; saut < 4; saut++) {
    const r = await fetch(url, { redirect: "manual", signal, headers: { "user-agent": "Mozilla/5.0 (compatible; parcours-apercu)", accept: "text/html,application/xhtml+xml" } });
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
      const suite = await urlAutorisee(new URL(r.headers.get("location")!, url).toString());
      if (!suite) return null;
      url = suite;
      continue;
    }
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("html") || !r.body) return null;
    const lecteur = r.body.getReader();
    const morceaux: Uint8Array[] = [];
    let total = 0;
    while (total < TAILLE_MAX) {
      const { done, value } = await lecteur.read();
      if (done) break;
      morceaux.push(value);
      total += value.length;
    }
    await lecteur.cancel().catch(() => {});
    return Buffer.concat(morceaux).toString("utf8");
  }
  return null;
}

const decoder = (t: string) =>
  t
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();

function meta(html: string, ...noms: string[]) {
  for (const nom of noms) {
    const balise = new RegExp(`<meta[^>]+(?:property|name)=["']${nom}["'][^>]*>`, "i").exec(html)?.[0];
    const valeur = balise && /content=(?:"([^"]*)"|'([^']*)')/i.exec(balise);
    if (valeur) return decoder(valeur[1] ?? valeur[2] ?? "");
  }
  return "";
}

function typeDe(url: URL): RessourceType {
  const h = url.hostname;
  if (/youtube|youtu\.be|vimeo/.test(h)) return "video";
  if (/spotify|deezer|podcast|radiofrance|franceinter|franceculture|ausha|acast|apple/.test(h)) return "podcast";
  if (url.pathname.toLowerCase().endsWith(".pdf")) return "pdf";
  return "lecture";
}

async function oEmbed(url: URL, signal: AbortSignal) {
  const point = /spotify\.com/.test(url.hostname)
    ? `https://open.spotify.com/oembed?url=${encodeURIComponent(url.toString())}`
    : /youtube\.com|youtu\.be/.test(url.hostname)
      ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url.toString())}`
      : null;
  if (!point) return null;
  const r = await fetch(point, { signal }).catch(() => null);
  if (!r?.ok) return null;
  return (await r.json().catch(() => null)) as { title?: string; author_name?: string; thumbnail_url?: string } | null;
}

// Récupère titre, image, auteur et description d'un lien. Si rien n'est trouvé, le titre est le nom du site.
export async function lireLien(brut: string): Promise<InfosLien | null> {
  const url = await urlAutorisee(brut.trim());
  if (!url) return null;
  const secours: InfosLien = { url: url.toString(), type: typeDe(url), titre: url.hostname.replace(/^www\./, ""), auteur: "", description: "", image: null };
  const controle = new AbortController();
  const minuterie = setTimeout(() => controle.abort(), DELAI_MS);
  try {
    const embed = await oEmbed(url, controle.signal);
    const html = await telecharger(url, controle.signal).catch(() => null);
    if (!html && !embed) return secours;
    const page = html ?? "";
    const titrePage = /<title[^>]*>([^<]*)<\/title>/i.exec(page)?.[1];
    const image = embed?.thumbnail_url ?? meta(page, "og:image", "twitter:image");
    let imageSure: string | null = null;
    try {
      const u = new URL(image, url);
      if (image && u.protocol === "https:") imageSure = u.toString();
    } catch {
      // pas d'image exploitable
    }
    return {
      ...secours,
      titre: embed?.title || meta(page, "og:title", "twitter:title") || (titrePage ? decoder(titrePage) : secours.titre),
      auteur: embed?.author_name || meta(page, "author", "article:author", "og:site_name"),
      description: meta(page, "og:description", "description", "twitter:description"),
      image: imageSure,
    };
  } finally {
    clearTimeout(minuterie);
  }
}
