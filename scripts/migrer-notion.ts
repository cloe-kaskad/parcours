/*
 * Migration de l'export Notion « QG — Blocages & Intuition » vers la plateforme.
 *
 * Usage (depuis la racine du repo ; les secrets sont lus dans .env.local, récupéré avec « vercel env pull .env.local ») :
 *   npx tsx scripts/migrer-notion.ts --export "/chemin/vers/Export-xxxx" --clientes scripts/clientes.json [--dry] [--force] [--cliente Déborah]
 *
 * --dry     : lit l'export et affiche ce qui serait créé, sans rien écrire.
 * --force   : si la cliente a déjà des séances sur la plateforme, efface ses données migrables et réimporte.
 * --cliente : ne traite qu'une cliente (par prénom, tel qu'il apparaît dans les dossiers Notion).
 *
 * scripts/clientes.json : [{ "dossier": "Déborah", "prenom": "Déborah", "nom": "…", "email": "…" }, …]
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

type ClienteConfig = { dossier: string; prenom: string; nom?: string; email: string };
type Exercice = { titre: string; consigne: string; pourquoi: string; bonus: boolean };
type Serie = { titre: string; intro: string; exercices: Exercice[]; seanceNumero: number | null; source: string };
type RessourceLue = { type: string; titre: string; url: string | null; fichier: string | null; pourquoi: string };

const args = process.argv.slice(2);
function opt(nom: string): string | undefined {
  const i = args.indexOf(nom);
  return i >= 0 ? args[i + 1] : undefined;
}
const DRY = args.includes("--dry");
const FORCE = args.includes("--force");
const SEULE = opt("--cliente");
const EXPORT = opt("--export");
const CLIENTES_PATH = opt("--clientes") ?? "scripts/clientes.json";

if (!EXPORT) {
  console.error("Indique le dossier de l'export : --export \"/chemin/vers/Export-…\"");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Lecture de l'export
// ---------------------------------------------------------------------------
const racine = resolve(EXPORT);
const dossierClientes = join(racine, "Private & Shared", "QG — Blocages & Intuition", "Clientes & Suivi");
if (!existsSync(dossierClientes)) {
  console.error(`Dossier introuvable : ${dossierClientes}`);
  process.exit(1);
}

function lire(p: string) {
  return readFileSync(p, "utf8").replace(/\r\n/g, "\n");
}

function decoderLien(depuis: string, lien: string) {
  const chemin = decodeURIComponent(lien.split("#")[0]);
  return resolve(dirname(depuis), chemin);
}

function sansMarkdownInline(s: string) {
  return s
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// Nettoie le Markdown Notion pour l'affichage sur la plateforme.
function nettoyerMarkdown(md: string) {
  return md
    .replace(/<aside>\s*/g, "> ")
    .replace(/\s*<\/aside>/g, "")
    .replace(/^!\[.*?\]\(.*?\)\s*$/gm, "") // images : non migrées
    .replace(/\[([^\]]+)\]\((?:\.\.\/)+attachments\/[^)]+\)/g, "$1") // pièces jointes : on garde le nom
    .replace(/\[\]\(\)/g, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function trouverPagePrincipale(dossier: string) {
  const fichiers = readdirSync(dossierClientes).filter((f) => f.startsWith(dossier) && f.endsWith(".md"));
  if (!fichiers.length) throw new Error(`Page principale introuvable pour ${dossier}`);
  return join(dossierClientes, fichiers[0]);
}

function sousDossier(dossier: string) {
  const d = readdirSync(dossierClientes).filter((f) => f.startsWith(dossier) && !f.endsWith(".md"));
  return d.length ? join(dossierClientes, d[0]) : null;
}

// Sections « ## Titre » d'une page Notion.
function sections(md: string) {
  const out: { titre: string; corps: string }[] = [];
  const lignes = md.split("\n");
  let courant: { titre: string; corps: string } | null = { titre: "", corps: "" };
  for (const l of lignes) {
    const m = /^##\s+(.*)$/.exec(l);
    if (m) {
      if (courant) out.push(courant);
      courant = { titre: m[1].trim(), corps: "" };
    } else if (courant) {
      courant.corps += l + "\n";
    }
  }
  if (courant) out.push(courant);
  return out;
}

function lireIntention(md: string) {
  const m = /<aside>([\s\S]*?)<\/aside>/.exec(md);
  if (!m) return "";
  return sansMarkdownInline(m[1].replace(/✅/g, ""));
}

function lireSeances(md: string, fichierMd: string) {
  const sec = sections(md).find((s) => /Mémoire des séances/i.test(s.titre));
  if (!sec) return [] as { numero: number; fichier: string | null }[];
  const res: { numero: number; fichier: string | null }[] = [];
  let courant: { numero: number; fichier: string | null } | null = null;
  for (const l of sec.corps.split("\n")) {
    const s = /^Séance\s*(\d+)/i.exec(l.trim());
    if (s) {
      courant = { numero: Number(s[1]), fichier: null };
      res.push(courant);
      continue;
    }
    const a = /\[([^\]]+)\]\(((?:\.\.\/)+attachments\/[^)]+)\)/.exec(l);
    if (a && courant && !courant.fichier) {
      const chemin = decoderLien(fichierMd, a[2]);
      courant.fichier = existsSync(chemin) ? chemin : null;
    }
  }
  return res;
}

const TYPES: [RegExp, string][] = [
  [/podcast/i, "podcast"],
  [/vid[ée]o|film|youtube|vimeo/i, "video"],
  [/lecture|livre|article/i, "lecture"],
];

function lireRessources(md: string, fichierMd: string): RessourceLue[] {
  const secs = sections(md);
  const debut = secs.findIndex((s) => /^Ressources/i.test(s.titre));
  const fin = secs.findIndex((s, i) => i > debut && /Notes libres/i.test(s.titre));
  if (debut < 0) return [];
  const res: RessourceLue[] = [];
  let type = "autre";
  for (const s of secs.slice(debut, fin < 0 ? undefined : fin)) {
    const t = TYPES.find(([re]) => re.test(s.titre));
    if (t) type = t[1];
    if (/^Ressources/i.test(s.titre) && /Vid[ée]o/i.test(s.corps)) type = "video";
    let derniere: RessourceLue | null = null;
    for (const brut of s.corps.split("\n")) {
      const l = brut.trim();
      if (!l || l === "---" || /^choisies$/i.test(l)) continue;
      const lien = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(l);
      if (lien) {
        const [, titre, cible] = lien;
        if (/^https?:\/\//.test(cible)) {
          const typeLien = /spotify\.com\/episode|podcast|radiofrance|deezer/i.test(cible)
            ? "podcast"
            : /youtube|youtu\.be|vimeo|arte\.tv/i.test(cible)
              ? "video"
              : type;
          derniere = { type: typeLien, titre: sansMarkdownInline(titre), url: cible, fichier: null, pourquoi: "" };
          res.push(derniere);
        } else if (/attachments\//.test(cible)) {
          const chemin = decoderLien(fichierMd, cible);
          if (existsSync(chemin) && !/le_parcours/i.test(chemin)) {
            derniere = { type: "pdf", titre: sansMarkdownInline(titre).replace(/\.pdf$/i, ""), url: null, fichier: chemin, pourquoi: "" };
            res.push(derniere);
          }
        }
        continue;
      }
      if (/^#/.test(l)) {
        const t2 = TYPES.find(([re]) => re.test(l));
        if (t2) type = t2[1];
        continue;
      }
      if (derniere && !/^!\[/.test(l)) {
        derniere.pourquoi = (derniere.pourquoi ? derniere.pourquoi + "\n" : "") + sansMarkdownInline(l);
      }
    }
  }
  return res;
}

// Titres d'exercices rencontrés dans Notion : « **Pratique 1 : X** », « ### Exo 2. X », « **Exercice 1 — X** »,
// « ## 1. X », « 1. **X** », « **3. X** », « ### **Exercice Bonus :** », « **Bonus : X** ».
// « faible » : titre générique (« Exercice 1 ») ou simple précision collée au mot (« Exercice Bonus pré-déjeuner Google »).
// Dans ce cas, une ligne entièrement en gras juste en dessous donne le vrai titre.
function titreExercice(ligne: string): { titre: string; bonus: boolean; faible?: boolean; precision?: string; garderLigne?: boolean } | null {
  const l = ligne.trim();
  if (!l || l.length > 140) return null;
  // Format « “Le Sens corporel” ⇒ inspiré de … » : titre entre guillemets suivi d'une flèche
  const guillemets = /^[“"«]\s*([^”"»]{2,60}?)\s*[”"»]\s*⇒/.exec(l);
  if (guillemets) return { titre: guillemets[1], bonus: false, garderLigne: true };
  const r = titreExerciceBrut(l);
  if (!r) return null;
  const generique = /^(Pratique|Exo|Exercice)\s*(\d+|bonus)?$/i.test(r.titre) || /^bonus$/i.test(r.titre);
  // « Exercice Bonus pré-déjeuner Google » : pas de séparateur entre « Bonus » et la suite
  const nu = l.replace(/<\/?u>|\*\*|^#{1,4}\s*/g, "").trim();
  const precision = /^(Pratique|Exo|Exercice)\s+(\d+|bonus)\s+[^:.\-—–\s]/i.test(nu) ? r.titre : undefined;
  return { ...r, faible: generique || !!precision, precision };
}

function titreExerciceBrut(l: string): { titre: string; bonus: boolean } | null {
  const nu = l
    .replace(/^#{1,4}\s*/, "")
    .replace(/<\/?u>/g, "")
    .replace(/\*\*/g, "")
    .replace(/^\*|\*$/g, "")
    .replace(/^BONUS\s*[-–—]\s*/, "Bonus ")
    .trim();
  let m = /^(?:Bonus\s+)?(Pratique|Exo|Exercice)\s+(\d+|bonus)\b\s*[:.\-—–]?\s*(.*)$/i.exec(nu);
  if (m) {
    const bonus = /bonus/i.test(m[2]) || /^bonus/i.test(nu) || /^bonus/i.test(m[3]);
    const titre = sansMarkdownInline(m[3].replace(/^bonus\s*[:.\-—–]?\s*/i, "")) || `${m[1]} ${m[2]}`.trim();
    return { titre: nettoyerTitre(titre), bonus };
  }
  m = /^(Pratique|Exo|Exercice)\s+bonus\b\s*[:.\-—–]?\s*(.*)$/i.exec(nu);
  if (m) return { titre: nettoyerTitre(sansMarkdownInline(m[2])) || "Bonus", bonus: true };
  m = /^Bonus\s*[:.\-—–]\s*(.+)$/i.exec(nu);
  if (m) return { titre: nettoyerTitre(sansMarkdownInline(m[1])), bonus: true };
  m = /^(\d+)\.\s+(.+)$/.exec(nu);
  if (m && (/^#{1,4}\s/.test(l) || /\*\*/.test(l))) {
    const bonus = /^bonus\s*:/i.test(m[2]);
    return { titre: nettoyerTitre(sansMarkdownInline(m[2].replace(/^bonus\s*:\s*/i, ""))), bonus };
  }
  return null;
}

function nettoyerTitre(t: string) {
  return t
    .replace(/^(Pratique|Exo|Exercice)\s*\d*\s*[:.\-—–]\s*/i, "")
    .replace(/\s*\((?:une seule fois|si tu|[^)]*envie)[^)]*\)\s*$/i, "")
    .replace(/[:\s*]+$/, "")
    .trim();
}

function parserExercices(md: string, source: string, titreParDefaut: string, seanceNumero: number | null): Serie {
  const corps = nettoyerMarkdown(md.replace(/^#\s.*\n/, ""));
  const lignes = corps.split("\n");
  // On coupe aux « pratiques précédentes » (liens vers les sous-pages déjà traitées à part)
  const coupe = lignes.findIndex((l) => /^#{1,4}\s*Pratiques? précédentes/i.test(l));
  const utiles = coupe >= 0 ? lignes.slice(0, coupe) : lignes;

  const blocs: { titre: string | null; lignes: string[]; bonus: boolean; faible?: boolean; precision?: string }[] = [{ titre: null, lignes: [], bonus: false }];
  for (const l of utiles) {
    const t = titreExercice(l);
    if (t) {
      blocs.push({ titre: t.titre, lignes: t.garderLigne ? [l] : [], bonus: t.bonus, faible: t.faible, precision: t.precision });
    } else {
      blocs[blocs.length - 1].lignes.push(l);
    }
  }
  // Titre faible suivi d'une ligne entièrement en gras : la ligne en gras devient le titre,
  // la précision éventuelle (« pré-déjeuner Google ») reste en tête de la consigne.
  for (const b of blocs.slice(1)) {
    if (!b.faible) continue;
    const i = b.lignes.findIndex((l) => l.trim() !== "");
    const gras = i >= 0 ? /^\*\*\s*(.+?)\s*\*\*$/.exec(b.lignes[i].trim()) : null;
    const candidat = gras ? gras[1].replace(/^[“"«]\s*|\s*[”"»]$/g, "").replace(/\s*:$/, "").trim() : "";
    if (!candidat || candidat.length > 70 || candidat.includes("**")) continue;
    b.titre = candidat;
    b.lignes.splice(i, 1);
    if (b.precision) b.lignes.unshift(`*${b.precision.charAt(0).toUpperCase()}${b.precision.slice(1)}*`, "");
  }

  let intro = blocs[0].lignes.join("\n").trim();
  // Titre de la série : première ligne « ### Pour … » si présente
  const titreLigne = /^#{1,4}\s*(Pour .*)$/m.exec(intro);
  const titre = titreLigne ? sansMarkdownInline(titreLigne[1]) : titreParDefaut;
  intro = intro.replace(/^#{1,4}\s*Pour .*$/m, "").trim();

  const exercices: Exercice[] = blocs.slice(1).map((b) => {
    const pourquoi: string[] = [];
    const reste: string[] = [];
    let dansPourquoi = false;
    for (const l of b.lignes) {
      const debutPourquoi = /^(>\s*)?(💡\s*)?(\*\*)?\s*Pourquoi (c[’']est important|ça compte)/i.test(l);
      if (debutPourquoi) dansPourquoi = true;
      else if (dansPourquoi && (l.trim() === "" || (!/^>/.test(l) && !/^>/.test(b.lignes[b.lignes.indexOf(l) - 1] ?? "")))) {
        // un paragraphe « Pourquoi » en gras s'arrête à la ligne vide suivante ; une citation continue tant qu'elle est citée
        if (l.trim() === "") dansPourquoi = false;
      }
      if (debutPourquoi || (dansPourquoi && l.trim() !== "")) {
        pourquoi.push(l.replace(/^>\s?/, "").replace(/^💡\s*/, "").trim());
      } else {
        reste.push(l);
      }
    }
    return {
      titre: b.titre!,
      consigne: reste.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
      pourquoi: pourquoi
        .join("\n")
        .replace(/^\*{0,2}\s*Pourquoi (c[’']est important|ça compte)\s*[:.]?\*{0,2}\s*/i, "")
        .trim(),
      bonus: b.bonus,
    };
  });

  return { titre, intro, exercices, seanceNumero, source };
}

// « Pour la séance N » = exercices donnés après la séance N-1 ; « post séance N » / « Pratiques séance N » = après la séance N.
function numeroDansTitre(t: string) {
  const pour = /pour\s.*?s[ée]ances?\s*(\d+)/i.exec(t);
  if (pour) return Math.max(1, Number(pour[1]) - 1);
  const m = /s[ée]ances?\s*(\d+)/i.exec(t);
  return m ? Number(m[1]) : null;
}

// Mois dans un titre de page (« Avril », « Aout »), ramené à une année de suivi qui commence en avril.
const MOIS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
function moisDansTitre(t: string) {
  const mot = t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const i = MOIS.findIndex((m) => mot === m || mot.startsWith(m + " "));
  return i < 0 ? null : (i + 12 - 3) % 12;
}

function lireSeries(dossier: string, pageMd: string, fichierMd: string): Serie[] {
  const series: Serie[] = [];
  const sec = sections(pageMd).find((s) => /Pratiques entre les séances/i.test(s.titre));
  const lien = sec ? /\[([^\]]+)\]\(([^)]+\.md)\)/.exec(sec.corps) : null;
  const sous = sousDossier(dossier);
  if (!lien || !sous) return series;
  const pagePratiques = decoderLien(fichierMd, lien[2]);
  if (!existsSync(pagePratiques)) return series;

  // Sous-pages de périodes passées
  const nomSansId = basename(pagePratiques).replace(/\s[0-9a-f]{32}\.md$/, "");
  const dossierPratiques = join(dirname(pagePratiques), nomSansId);
  if (existsSync(dossierPratiques) && statSync(dossierPratiques).isDirectory()) {
    const passees: { serie: Serie; cle: number }[] = [];
    for (const f of readdirSync(dossierPratiques).filter((x) => x.endsWith(".md")).sort()) {
      const titre = f.replace(/\s[0-9a-f]{32}\.md$/, "");
      if (/questionnaire/i.test(titre)) continue; // journal d'une semaine : pas un envoi d'exercices
      const md = lire(join(dossierPratiques, f));
      // Numéro de séance : dans le titre, sinon dans le début du texte (« Exercices pour la séance 8 de rentrée »)
      const numero = numeroDansTitre(titre) ?? numeroDansTitre(md.replace(/^#\s.*\n/, "").slice(0, 300));
      const mois = moisDansTitre(titre);
      passees.push({ serie: parserExercices(md, f, titre, numero), cle: numero ?? (mois !== null ? 100 + mois : 1000) });
    }
    // Ordre chronologique : par séance, sinon par mois (avril à mars), sinon à la fin
    passees.sort((a, b) => a.cle - b.cle);
    series.push(...passees.map((p) => p.serie));
  }
  // Page courante (la plus récente)
  const md = lire(pagePratiques);
  const titreCourant = (/^#{1,4}\s*(Pour .*)$/m.exec(md)?.[1] ?? "").trim() || "Exercices en cours";
  // Page courante : rattachée à la séance indiquée, sinon à la dernière séance connue (-1 = « dernière »)
  series.push(parserExercices(md, basename(pagePratiques), sansMarkdownInline(titreCourant), numeroDansTitre(md.slice(0, 400)) ?? -1));
  return series;
}

function lirePageLiee(pageMd: string, fichierMd: string, motif: RegExp) {
  const sec = sections(pageMd).find((s) => motif.test(s.titre));
  const lien = sec ? /\[([^\]]+)\]\(([^)]+\.md)\)/.exec(sec.corps) : null;
  if (!lien) return null;
  const chemin = decoderLien(fichierMd, lien[2]);
  if (!existsSync(chemin)) return null;
  return nettoyerMarkdown(lire(chemin).replace(/^#\s.*\n/, ""));
}

function lireFeedback(dossier: string) {
  const sous = sousDossier(dossier);
  if (!sous) return null;
  const f = readdirSync(sous).find((x) => /feedback/i.test(x) && x.endsWith(".md"));
  if (!f) return null;
  const md = nettoyerMarkdown(lire(join(sous, f)).replace(/^#\s.*\n/, ""));
  // Rempli si au moins une réponse « → … »
  return /→\s*\S/.test(md) ? md : null;
}

// ---------------------------------------------------------------------------
// Écriture sur la plateforme
// ---------------------------------------------------------------------------
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const cle = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
if (!DRY && (!url || !cle)) {
  console.error("Variables NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes (à renseigner dans .env.local).");
  process.exit(1);
}
const supabase = DRY ? null : createClient(url, cle, { auth: { autoRefreshToken: false, persistSession: false } });

function mime(p: string) {
  return p.toLowerCase().endsWith(".pdf") ? "application/pdf" : p.toLowerCase().endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/octet-stream";
}

async function deposer(bucket: string, chemin: string, fichier: string) {
  if (!supabase) return chemin;
  // Trois essais : les gros PDF (plus de 10 Mo) échouent parfois sur une coupure réseau
  let message = "";
  for (let essai = 1; essai <= 3; essai++) {
    const { error } = await supabase.storage.from(bucket).upload(chemin, readFileSync(fichier), { contentType: mime(fichier), upsert: true });
    if (!error) return chemin;
    message = error.message;
    console.log(`  (dépôt ${basename(fichier)} : essai ${essai} échoué, ${message})`);
    await new Promise((r) => setTimeout(r, 3000 * essai));
  }
  throw new Error(`Dépôt ${bucket}/${chemin} : ${message}`);
}

async function trouverOuCreerCompte(c: ClienteConfig): Promise<string> {
  if (!supabase) return "dry-" + c.prenom;
  const { data: existant } = await supabase.from("profiles").select("id").eq("email", c.email.trim().toLowerCase()).maybeSingle();
  if (existant?.id) {
    await supabase.from("profiles").update({ prenom: c.prenom, nom: c.nom ?? "", role: "cliente", actif: true }).eq("id", existant.id);
    return existant.id as string;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email: c.email.trim().toLowerCase(),
    email_confirm: true,
    user_metadata: { role: "cliente", prenom: c.prenom, nom: c.nom ?? "" },
  });
  if (error) throw new Error(`Compte ${c.email} : ${error.message}`);
  await supabase.from("profiles").update({ prenom: c.prenom, nom: c.nom ?? "", role: "cliente" }).eq("id", data.user.id);
  return data.user.id;
}

async function migrerCliente(c: ClienteConfig) {
  const fichierMd = trouverPagePrincipale(c.dossier);
  const md = lire(fichierMd);
  const intention = lireIntention(md);
  const seances = lireSeances(md, fichierMd);
  const ressources = lireRessources(md, fichierMd);
  const series = lireSeries(c.dossier, md, fichierMd);
  const notes = lirePageLiee(md, fichierMd, /Notes libres/i);
  const feedback = lireFeedback(c.dossier);

  console.log(`\n=== ${c.prenom} (${c.email})`);
  console.log(`Intention : ${intention.slice(0, 120)}${intention.length > 120 ? "…" : ""}`);
  console.log(`Séances : ${seances.map((s) => `${s.numero}${s.fichier ? " (fichier)" : ""}`).join(", ") || "aucune"}`);
  console.log(`Envois d'exercices : ${series.length}`);
  for (const s of series) console.log(`  - ${s.titre} [séance ${s.seanceNumero === -1 ? "dernière" : (s.seanceNumero ?? "aucune")}] : ${s.exercices.length} exercice(s) ${s.exercices.map((e) => `« ${e.titre} »`).join(", ")}`);
  console.log(`Ressources : ${ressources.length} ${ressources.map((r) => `[${r.type}] ${r.titre}`).join(" | ")}`);
  console.log(`Notes libres : ${notes ? `${notes.length} caractères` : "vides"} · Feedback : ${feedback ? "rempli" : "non"}`);
  if (DRY || !supabase) return;

  const clienteId = await trouverOuCreerCompte(c);
  let { data: parcours } = await supabase.from("parcours").select("id").eq("cliente_id", clienteId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!parcours) {
    const { data: prog } = await supabase.from("programmes").select("id").eq("slug", "bi").single();
    const { data: nouveau, error } = await supabase.from("parcours").insert({ cliente_id: clienteId, programme_id: prog!.id, intention }).select("id").single();
    if (error) throw error;
    parcours = nouveau;
  } else {
    await supabase.from("parcours").update({ intention }).eq("id", parcours.id);
  }
  const parcoursId = parcours.id as string;

  const { count } = await supabase.from("seances").select("id", { count: "exact", head: true }).eq("parcours_id", parcoursId);
  if ((count ?? 0) > 0) {
    if (!FORCE) {
      console.log(`  → ${c.prenom} a déjà des séances sur la plateforme, ignorée (utilise --force pour réimporter).`);
      return;
    }
    await supabase.from("pratiques_series").delete().eq("parcours_id", parcoursId);
    await supabase.from("ressources_affectations").delete().eq("parcours_id", parcoursId);
    await supabase.from("seances").delete().eq("parcours_id", parcoursId);
    await supabase.from("journal").delete().eq("cliente_id", clienteId);
    await supabase.from("feedbacks").delete().eq("cliente_id", clienteId);
  }

  // Séances et transcripts
  const idsSeances = new Map<number, string>();
  for (const s of seances) {
    const { data, error } = await supabase
      .from("seances")
      .insert({ parcours_id: parcoursId, numero: s.numero, statut: "faite", transcript_statut: s.fichier ? "pret" : "aucun" })
      .select("id")
      .single();
    if (error) throw error;
    idsSeances.set(s.numero, data.id);
    if (s.fichier) {
      const ext = s.fichier.toLowerCase().endsWith(".docx") ? "docx" : "pdf";
      const chemin = await deposer("transcripts", `${parcoursId}/${data.id}/transcript.${ext}`, s.fichier);
      await supabase.from("seances").update({ transcript_pdf_path: chemin, envoye_emilien_at: new Date().toISOString() }).eq("id", data.id);
    }
  }

  // Séances référencées par des exercices mais sans transcript dans Notion : créées vides pour garder le lien
  const maxNumero = Math.max(0, ...seances.map((s) => s.numero));
  for (const s of series) {
    if (s.seanceNumero && s.seanceNumero > 0 && !idsSeances.has(s.seanceNumero)) {
      const { data, error } = await supabase.from("seances").insert({ parcours_id: parcoursId, numero: s.seanceNumero, statut: "faite" }).select("id").single();
      if (error) throw error;
      idsSeances.set(s.seanceNumero, data.id);
    }
  }
  const derniereSeance = idsSeances.get(Math.max(maxNumero, ...idsSeances.keys())) ?? null;

  // Exercices : publiés dans l'ordre, dates fictives croissantes pour garder l'ordre d'affichage
  const base = Date.now() - series.length * 86_400_000;
  for (const [i, s] of series.entries()) {
    const { data: serie, error } = await supabase
      .from("pratiques_series")
      .insert({
        parcours_id: parcoursId,
        seance_id: s.seanceNumero === -1 ? derniereSeance : s.seanceNumero ? (idsSeances.get(s.seanceNumero) ?? null) : null,
        titre: s.titre,
        intro: s.intro,
        publiee_at: new Date(base + i * 86_400_000).toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    for (const [j, e] of s.exercices.entries()) {
      const { error: errEx } = await supabase.from("pratiques").insert({ serie_id: serie.id, ordre: j + 1, titre: e.titre, consigne: e.consigne, pourquoi: e.pourquoi, bonus: e.bonus });
      if (errEx) throw errEx;
    }
  }

  // Ressources : une entrée de bibliothèque par lien (dédoublonnée sur l'URL), affectée à la cliente
  for (const r of ressources) {
    let ressourceId: string | null = null;
    if (r.url) {
      const { data: ex } = await supabase.from("ressources").select("id").eq("url", r.url).maybeSingle();
      ressourceId = (ex?.id as string | undefined) ?? null;
    }
    if (!ressourceId) {
      let fichierPath: string | null = null;
      if (r.fichier) fichierPath = await deposer("ressources", `bibliotheque/${basename(r.fichier)}`, r.fichier);
      const { data: cree, error } = await supabase.from("ressources").insert({ type: r.type, titre: r.titre, url: r.url, fichier_path: fichierPath }).select("id").single();
      if (error) throw error;
      ressourceId = cree.id;
    }
    await supabase.from("ressources_affectations").upsert({ ressource_id: ressourceId, parcours_id: parcoursId, pourquoi: r.pourquoi, publiee_at: new Date().toISOString() }, { onConflict: "ressource_id,parcours_id" });
  }

  if (notes) {
    await supabase.from("journal").insert({ cliente_id: clienteId, date: new Date().toISOString().slice(0, 10), contenu: `Notes reprises de Notion\n\n${notes}`, pour_prochaine_seance: true });
  }
  if (feedback) {
    await supabase.from("feedbacks").insert({ cliente_id: clienteId, cycle: 1, reponses: { source: "notion", markdown: feedback } });
  }
  console.log(`  → ${c.prenom} migrée.`);
}

async function main() {
  if (!existsSync(CLIENTES_PATH)) {
    console.error(`Fichier des clientes introuvable : ${CLIENTES_PATH} (voir scripts/clientes.exemple.json)`);
    process.exit(1);
  }
  const clientes = JSON.parse(readFileSync(CLIENTES_PATH, "utf8")) as ClienteConfig[];
  for (const c of clientes) {
    if (SEULE && c.dossier !== SEULE && c.prenom !== SEULE) continue;
    if (!c.email || c.email.includes("À_REMPLIR")) {
      console.log(`\n=== ${c.prenom} : email manquant dans ${CLIENTES_PATH}, ignorée.`);
      continue;
    }
    await migrerCliente(c);
  }
  console.log(DRY ? "\nLecture à blanc terminée, rien n'a été écrit." : "\nMigration terminée.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
