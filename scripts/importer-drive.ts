/*
 * Import de la matière historique du Drive (docs/04-fiche-cliente-vue-equipe.md, section 2, point 5).
 *
 * Lit un dossier par cliente, reconnaît les fichiers par leur nom (« Retour Emilien Deborah 3 »,
 * « Prep Déborah Session 3 », « Session 3 Déborah Transcript », « Note Déborah »…), propose la
 * correspondance fichier → cliente → séance, puis importe :
 *   - retour d'Émilien : PDF dans le bucket « retours », texte dans retours.contenu,
 *     marqué envoyé à la date du fichier, source « drive » ;
 *   - préparation : PDF dans « preparations », texte dans seances_preparations.contenu ;
 *   - transcript : texte dans seances.transcript_formate (si vide), PDF dans « transcripts »
 *     (si la séance n'en a pas déjà un) ;
 *   - note d'Émilien : PDF dans « notes », une ligne dans notes_emilien.
 * Rien n'est écrasé : ce qui existe déjà sur la plateforme est signalé et laissé tel quel.
 *
 * Usage :
 *   npx tsx scripts/importer-drive.ts --dossier "/chemin/vers/Blocages & Intuition" [--dossier …] --dry
 *   npx tsx scripts/importer-drive.ts --dossier "…" [--corrections scripts/drive-corrections.json]
 *
 * --dry          : lecture à blanc, rien n'est écrit (ni base, ni stockage).
 * --corrections  : arbitrages de Cloé, par chemin relatif du fichier :
 *                  { "Déborah/Note.pdf": { "type": "retour", "numero": 3, "cliente": "Déborah" },
 *                    "Vanessa/3bis.docx": { "type": "transcript", "numero": 3, "ajout": "Seconde partie (3bis)" },
 *                    "Déborah/brouillon.pdf": "ignorer" }
 *                  Fichier gitignoré (il contient des prénoms de clientes).
 * Les secrets sont lus dans .env.local (vercel env pull .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const args = process.argv.slice(2);
const DOSSIERS = args.flatMap((a, i) => (a === "--dossier" ? [args[i + 1]] : []));
const DRY = args.includes("--dry");
const iCorr = args.indexOf("--corrections");
const CORRECTIONS_PATH = iCorr >= 0 ? args[iCorr + 1] : "scripts/drive-corrections.json";

if (!DOSSIERS.length) {
  console.error("Indique le dossier du Drive : --dossier \"/chemin/vers/Blocages & Intuition\"");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

type Type = "retour" | "preparation" | "transcript" | "note";
// « ajout » : le texte s'ajoute, sous ce titre, à ce que la séance a déjà (seconde partie, autre version).
type Correction = "ignorer" | { type?: Type; numero?: number; cliente?: string; ajout?: string };
const corrections: Record<string, Correction> = existsSync(CORRECTIONS_PATH) ? JSON.parse(readFileSync(CORRECTIONS_PATH, "utf8")) : {};

// ---------------------------------------------------------------------------
// Reconnaissance par le nom
// ---------------------------------------------------------------------------
const normaliser = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const EXT_TEXTE = new Set([".pdf", ".docx", ".txt", ".md"]);
const EXT_AUDIO = new Set([".m4a", ".mp3", ".wav", ".aac", ".mp4", ".mov", ".ogg"]);

// « Fichier(1) » ou « Fichier (2) » : une copie, le chiffre n'est pas un numéro de séance.
const sansCopie = (nom: string) => nom.replace(/\s*\(\d\)$/, "");

function deviner(nom: string): { type: Type | null; numero: number | null } {
  const n = normaliser(sansCopie(basename(nom, extname(nom))));
  let type: Type | null = null;
  if (/\bgpt\b/.test(n)) type = null; // relectures par ChatGPT : pas un retour d'Émilien
  else if (/\bretour/.test(n) && !/\bexo\b/.test(n)) type = "retour";
  else if (/\bprep(a|aration)?\b|preparation/.test(n)) type = "preparation";
  else if (/transcri/.test(n)) type = "transcript";
  else if (/^notes?\b/.test(n)) type = "note";
  const explicite = n.match(/(?:session|seance|s|#)\s*#?\s*(\d{1,2})\b/);
  const nombres = [...n.matchAll(/\b(\d{1,2})\b/g)].map((m) => Number(m[1]));
  const numero = explicite ? Number(explicite[1]) : nombres.length ? nombres[nombres.length - 1] : null;
  return { type, numero };
}

function lister(dossier: string): string[] {
  return readdirSync(dossier).flatMap((f) => {
    if (f.startsWith(".")) return [];
    const p = join(dossier, f);
    return statSync(p).isDirectory() ? lister(p) : [p];
  });
}

async function lireTexte(p: string): Promise<string> {
  const ext = extname(p).toLowerCase();
  if (ext === ".pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(readFileSync(p)));
    const { text } = await extractText(pdf, { mergePages: true });
    return nettoyer(Array.isArray(text) ? text.join("\n\n") : text);
  }
  if (ext === ".docx") return nettoyer((await mammoth.extractRawText({ path: p })).value);
  return nettoyer(readFileSync(p, "utf8"));
}

const nettoyer = (t: string) =>
  t
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const slug = (s: string) => normaliser(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "fichier";
const dateFr = (d: Date) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(d);

// ---------------------------------------------------------------------------
// Ce qui existe sur la plateforme
// ---------------------------------------------------------------------------
type Cliente = { id: string; prenom: string; parcoursId: string | null; seances: Map<number, { id: string; statut: string; transcript_formate: string | null; transcript_pdf_path: string | null }> };

async function chargerClientes(): Promise<Cliente[]> {
  const { data: profils, error } = await supabase.from("profiles").select("id, prenom").eq("role", "cliente");
  if (error) throw error;
  const resultat: Cliente[] = [];
  for (const p of profils ?? []) {
    const { data: parcours } = await supabase.from("parcours").select("id").eq("cliente_id", p.id).order("created_at").limit(1);
    const parcoursId = parcours?.[0]?.id ?? null;
    const seances = new Map<number, { id: string; statut: string; transcript_formate: string | null; transcript_pdf_path: string | null }>();
    if (parcoursId) {
      const { data } = await supabase.from("seances").select("id, numero, statut, transcript_formate, transcript_pdf_path").eq("parcours_id", parcoursId);
      for (const s of data ?? []) seances.set(s.numero, s);
    }
    resultat.push({ id: p.id, prenom: p.prenom, parcoursId, seances });
  }
  return resultat;
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------
type Ligne = {
  rel: string;
  chemin: string;
  date: Date;
  cliente: Cliente | null;
  type: Type | null;
  numero: number | null;
  seanceId: string | null;
  action: "importer" | "ignorer" | "arbitrer" | "deja";
  raison: string;
  corrige: boolean;
  ajout: string | null;
};

async function main() {
  const clientes = await chargerClientes();
  const { data: emiliens } = await supabase.from("profiles").select("id, prenom").eq("role", "relecteur");
  const emilien = emiliens?.[0];
  if (!emilien) throw new Error("Aucun profil relecteur (Émilien) en base.");

  const trouverCliente = (nom: string) => clientes.find((c) => normaliser(c.prenom) === normaliser(nom)) ?? null;

  const lignes: Ligne[] = [];
  for (const dossier of DOSSIERS.map((d) => resolve(d))) {
    if (!existsSync(dossier)) {
      console.error(`Dossier introuvable : ${dossier}`);
      process.exit(1);
    }
    for (const chemin of lister(dossier)) {
      const rel = relative(dossier, chemin).normalize("NFC");
      const ext = extname(chemin).toLowerCase();
      const premier = rel.includes("/") ? rel.split("/")[0] : null;
      const date = statSync(chemin).mtime;
      const devine = deviner(basename(chemin));
      const corr = corrections[rel];
      let cliente = premier ? trouverCliente(premier) : null;
      let { type, numero } = devine;
      if (corr && corr !== "ignorer") {
        if (corr.cliente) cliente = trouverCliente(corr.cliente);
        if (corr.type) type = corr.type;
        if (corr.numero !== undefined) numero = corr.numero;
      }
      const ligne: Ligne = { rel, chemin, date, cliente, type, numero, seanceId: null, action: "importer", raison: "", corrige: Boolean(corr), ajout: corr && corr !== "ignorer" ? (corr.ajout ?? null) : null };
      lignes.push(ligne);

      if (corr === "ignorer") Object.assign(ligne, { action: "ignorer", raison: "ignoré à ta demande" });
      else if (EXT_AUDIO.has(ext)) Object.assign(ligne, { action: "ignorer", raison: "audio (hors du périmètre de l'import)" });
      else if (!EXT_TEXTE.has(ext)) Object.assign(ligne, { action: "ignorer", raison: `format ${ext || "inconnu"} non lu` });
      else if (!cliente) Object.assign(ligne, { action: "arbitrer", raison: premier ? `dossier « ${premier} » : aucune cliente de ce prénom` : "hors d'un dossier de cliente" });
      else if (!type) Object.assign(ligne, { action: "arbitrer", raison: "type non reconnu (retour, préparation, transcript ou note ?)" });
      else if (type === "note") {
        if (ext !== ".pdf") Object.assign(ligne, { action: "arbitrer", raison: "note en Word : à exporter en PDF, ou à ignorer" });
      } else if (numero === null) Object.assign(ligne, { action: "arbitrer", raison: "numéro de séance introuvable dans le nom" });
      else {
        const s = cliente.seances.get(numero);
        if (!s) Object.assign(ligne, { action: "arbitrer", raison: `séance ${numero} absente de la plateforme` });
        else if (s.statut !== "faite") Object.assign(ligne, { action: "arbitrer", raison: `la séance ${numero} de la plateforme n'a pas encore eu lieu : numérotation à vérifier` });
        else ligne.seanceId = s.id;
      }
    }
  }

  // Copies (« (1) ») au contenu identique à l'original : on garde l'original.
  const parNom = new Map(lignes.map((l) => [l.rel, l]));
  for (const l of lignes.filter((x) => x.action === "importer" && /\(\d\)$/.test(basename(x.rel, extname(x.rel))))) {
    const original = parNom.get(l.rel.replace(/\s*\(\d\)(\.[^.]+)$/, "$1"));
    if (original && readFileSync(original.chemin).equals(readFileSync(l.chemin))) Object.assign(l, { action: "ignorer", raison: "copie identique de l'original" });
  }

  // Doublons : deux fichiers pour le même objet d'une même séance.
  const cle = (l: Ligne) => `${l.cliente?.id}|${l.type}|${l.type === "note" ? l.rel : l.numero}`;
  const groupes = new Map<string, Ligne[]>();
  for (const l of lignes.filter((l) => l.action === "importer" && !l.ajout)) groupes.set(cle(l), [...(groupes.get(cle(l)) ?? []), l]);
  for (const g of groupes.values()) {
    if (g.length > 1) for (const l of g) Object.assign(l, { action: "arbitrer", raison: `${g.length} fichiers pour le même ${l.type} : lequel garder ?` });
  }

  // Ce qui existe déjà sur la plateforme.
  for (const l of lignes.filter((l) => l.action === "importer" && !l.ajout)) {
    if (l.type === "retour") {
      const { data } = await supabase.from("retours").select("id, source, fichier_path").eq("seance_id", l.seanceId!).eq("auteur_id", emilien.id).maybeSingle();
      if (data) Object.assign(l, { action: "deja", raison: data.source === "drive" ? "déjà importé" : "Émilien a déjà un retour sur la plateforme pour cette séance" });
    } else if (l.type === "preparation") {
      const { data } = await supabase.from("seances_preparations").select("contenu, source").eq("seance_id", l.seanceId!).maybeSingle();
      if (data?.contenu?.trim()) Object.assign(l, { action: "deja", raison: data.source === "drive" ? "déjà importé" : "préparation déjà écrite sur la plateforme" });
    } else if (l.type === "transcript") {
      const s = [...l.cliente!.seances.values()].find((x) => x.id === l.seanceId);
      if (s?.transcript_formate?.trim()) Object.assign(l, { action: "deja", raison: "la séance a déjà un transcript en texte" });
    } else if (l.type === "note") {
      const { data } = await supabase.from("notes_emilien").select("id").eq("cliente_id", l.cliente!.id).like("fichier_path", `%/drive-${slug(basename(l.rel, extname(l.rel)))}.pdf`);
      if (data?.length) Object.assign(l, { action: "deja", raison: "déjà importée" });
    }
  }

  // Un ajout déjà fait se reconnaît à son titre : on ne l'ajoute pas deux fois.
  for (const l of lignes.filter((l) => l.action === "importer" && l.ajout)) {
    const titre = `## ${l.ajout}`;
    let present = "";
    if (l.type === "retour") present = (await supabase.from("retours").select("contenu").eq("seance_id", l.seanceId!).eq("auteur_id", emilien.id).maybeSingle()).data?.contenu ?? "";
    else if (l.type === "preparation") present = (await supabase.from("seances_preparations").select("contenu").eq("seance_id", l.seanceId!).maybeSingle()).data?.contenu ?? "";
    else if (l.type === "transcript") present = (await supabase.from("seances").select("transcript_formate").eq("id", l.seanceId!).single()).data?.transcript_formate ?? "";
    if (present.includes(titre)) Object.assign(l, { action: "deja", raison: "déjà ajouté" });
  }

  // Lecture des textes (aussi en lecture à blanc, pour montrer ce qui sera lu).
  const textes = new Map<string, string>();
  for (const l of lignes.filter((l) => l.action === "importer" && l.type !== "note")) {
    try {
      const t = await lireTexte(l.chemin);
      textes.set(l.rel, t);
      if (!t) Object.assign(l, { action: "arbitrer", raison: "aucun texte lisible (PDF scanné ?)" });
    } catch (e) {
      Object.assign(l, { action: "arbitrer", raison: `lecture impossible : ${e instanceof Error ? e.message : e}` });
    }
  }

  // ---------------------------------------------------------------------------
  // Affichage
  // ---------------------------------------------------------------------------
  const NOMS: Record<Type, string> = { retour: "retour d'Émilien", preparation: "préparation", transcript: "transcript", note: "note d'Émilien" };
  const decrire = (l: Ligne) => {
    const quoi = l.type ? NOMS[l.type] : "?";
    const ou = l.type === "note" ? "dans son espace" : l.numero !== null ? `séance ${l.numero}` : "séance ?";
    const taille = textes.get(l.rel) ? ` · ${textes.get(l.rel)!.length.toLocaleString("fr-FR")} caractères` : "";
    return `  « ${basename(l.rel)} » → ${quoi}, ${ou}${l.ajout ? ` (ajouté sous « ${l.ajout} »)` : ""} · ${dateFr(l.date)}${taille}${l.corrige ? " (corrigé)" : ""}`;
  };
  const parCliente = new Map<string, Ligne[]>();
  for (const l of lignes) {
    const k = l.cliente?.prenom ?? (l.rel.includes("/") ? `${l.rel.split("/")[0]} (cliente non reconnue)` : "Hors dossier");
    parCliente.set(k, [...(parCliente.get(k) ?? []), l]);
  }
  console.log(DRY ? "\nLECTURE À BLANC : rien n'est écrit.\n" : "\nIMPORT RÉEL\n");
  for (const [prenom, ls] of [...parCliente.entries()].sort()) {
    console.log(`=== ${prenom}`);
    const tri = (a: Ligne, b: Ligne) => (a.numero ?? 99) - (b.numero ?? 99) || a.rel.localeCompare(b.rel);
    const blocs: [Ligne["action"], string][] = [["importer", "À importer"], ["arbitrer", "À arbitrer"], ["deja", "Déjà présent, laissé tel quel"], ["ignorer", "Ignoré"]];
    for (const [action, titre] of blocs) {
      const sel = ls.filter((l) => l.action === action).sort(tri);
      if (!sel.length) continue;
      console.log(` ${titre} (${sel.length})`);
      for (const l of sel) console.log(decrire(l) + (l.raison ? `\n      ${l.raison}` : ""));
    }
    console.log("");
  }
  const compte = (a: Ligne["action"]) => lignes.filter((l) => l.action === a).length;
  console.log(`Total : ${lignes.length} fichiers · ${compte("importer")} à importer · ${compte("arbitrer")} à arbitrer · ${compte("deja")} déjà présents · ${compte("ignorer")} ignorés`);

  if (DRY) return;

  // ---------------------------------------------------------------------------
  // Import
  // ---------------------------------------------------------------------------
  let faits = 0;
  // Les ajouts passent après les textes principaux.
  const aImporter = lignes.filter((l) => l.action === "importer").sort((a, b) => Number(Boolean(a.ajout)) - Number(Boolean(b.ajout)));
  for (const l of aImporter) {
    const estPdf = extname(l.chemin).toLowerCase() === ".pdf";
    const nom = `drive-${slug(basename(l.rel, extname(l.rel)))}.pdf`;
    const deposer = async (bucket: string, dossier: string) => {
      const chemin = `${dossier}/${nom}`;
      const { error } = await supabase.storage.from(bucket).upload(chemin, readFileSync(l.chemin), { contentType: "application/pdf", upsert: true });
      if (error) throw new Error(`stockage ${bucket} : ${error.message}`);
      return chemin;
    };
    try {
      const texte = textes.get(l.rel) ?? "";
      const date = l.date.toISOString();
      const ajouter = (avant: string | null | undefined) => [avant?.trim(), `## ${l.ajout}\n\n${texte}`].filter(Boolean).join("\n\n");
      if (l.ajout && l.type === "retour") {
        const { data: r } = await supabase.from("retours").select("id, contenu").eq("seance_id", l.seanceId!).eq("auteur_id", emilien.id).maybeSingle();
        const { error } = r
          ? await supabase.from("retours").update({ contenu: ajouter(r.contenu) }).eq("id", r.id)
          : await supabase.from("retours").insert({ seance_id: l.seanceId, auteur_id: emilien.id, contenu: ajouter(null), source: "drive", envoye_at: date, created_at: date });
        if (error) throw error;
      } else if (l.ajout && l.type === "preparation") {
        const { data: p } = await supabase.from("seances_preparations").select("contenu").eq("seance_id", l.seanceId!).maybeSingle();
        const { error } = await supabase.from("seances_preparations").upsert({ seance_id: l.seanceId, contenu: ajouter(p?.contenu), source: "drive" }, { onConflict: "seance_id" });
        if (error) throw error;
      } else if (l.ajout && l.type === "transcript") {
        const { data: s } = await supabase.from("seances").select("transcript_formate").eq("id", l.seanceId!).single();
        const { error } = await supabase.from("seances").update({ transcript_formate: ajouter(s?.transcript_formate), transcript_statut: "pret" }).eq("id", l.seanceId!);
        if (error) throw error;
      } else if (l.type === "retour") {
        const fichier_path = estPdf ? await deposer("retours", l.seanceId!) : null;
        const { error } = await supabase.from("retours").insert({ seance_id: l.seanceId, auteur_id: emilien.id, contenu: texte, fichier_path, source: "drive", envoye_at: date, created_at: date });
        if (error) throw error;
      } else if (l.type === "preparation") {
        const fichier_path = estPdf ? await deposer("preparations", l.seanceId!) : null;
        const { error } = await supabase.from("seances_preparations").upsert({ seance_id: l.seanceId, contenu: texte, fichier_path, source: "drive" }, { onConflict: "seance_id" });
        if (error) throw error;
      } else if (l.type === "transcript") {
        const s = [...l.cliente!.seances.values()].find((x) => x.id === l.seanceId)!;
        const maj: Record<string, unknown> = { transcript_formate: texte, transcript_statut: "pret" };
        if (estPdf && !s.transcript_pdf_path) maj.transcript_pdf_path = await deposer("transcripts", l.seanceId!);
        const { error } = await supabase.from("seances").update(maj).eq("id", l.seanceId!);
        if (error) throw error;
      } else if (l.type === "note") {
        const fichier_path = await deposer("notes", l.cliente!.id);
        const { error } = await supabase.from("notes_emilien").insert({ cliente_id: l.cliente!.id, titre: "Une note d’Émilien", fichier_path, deposee_at: date });
        if (error) throw error;
      }
      faits++;
      console.log(`OK  ${l.rel}`);
    } catch (e) {
      console.log(`ÉCHEC  ${l.rel} : ${e instanceof Error ? e.message : JSON.stringify(e)}`);
    }
  }
  console.log(`\n${faits} fichiers importés.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
