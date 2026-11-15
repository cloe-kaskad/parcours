// La préparation d'une séance, découpée pour le mode en séance, et sa « version séance » (migration 0008).
// Fonctions pures, utilisées côté serveur (proposition, contrôles) et côté navigateur (affichage, éditeurs).
import { memesMots } from "./retour";

// Un bloc de section : du texte de conduite (Markdown), ou un texte à lire mot pour mot à la cliente.
export type BlocSeance = { type: "texte"; contenu: string } | { type: "integral"; titre: string; contenu: string };
export type SectionSeance = { titre: string; duree: string; blocs: BlocSeance[] };

// Un texte à lire en entier se marque dans la préparation par deux lignes :
//   :::a-lire Visualisation guidée
//   … le texte, mot pour mot …
//   :::
export const DEBUT_A_LIRE = /^\s*:::\s*a-lire\b\s*(.*)$/i;
const FIN_A_LIRE = /^\s*:::\s*$/;
// Une section dont le titre dit qu'elle se lit à voix haute est gardée entière.
export const TITRE_A_LIRE = /visualisation|[àa] lire|texte guid[ée]|script/i;
const TITRE_MD = /^(#{1,6})\s+(.+?)\s*#*\s*$/;

export const NOM_INTEGRAL = "Texte à lire en entier";

// Le geste « Texte à lire en entier » d'un éditeur : entoure la sélection des deux lignes de marque.
export function marquerALire(texte: string, debut: number, fin: number, titre = "") {
  const avant = texte.slice(0, debut).replace(/\s*$/, "");
  const milieu = texte.slice(debut, fin).trim();
  const apres = texte.slice(fin).replace(/^\s*/, "");
  const bloc = `:::a-lire${titre ? ` ${titre}` : ""}\n${milieu}\n:::`;
  const resultat = [avant, bloc, apres].filter(Boolean).join("\n\n");
  return { texte: resultat, curseur: (avant ? avant.length + 2 : 0) + bloc.length };
}

const mots = (t: string) => t.match(/[\p{L}\p{N}]+/gu) ?? [];
export const nombreDeMots = (t: string) => mots(t).length;

// Le temps d'une lecture à voix haute, posée (environ 120 mots par minute).
export const minutesALire = (t: string) => Math.max(1, Math.round(nombreDeMots(t) / 120));

// L'empreinte de la préparation, pour savoir si elle a changé depuis la proposition.
export function empreinte(texte: string) {
  let h = 0x811c9dc5;
  const t = texte.replace(/\r\n?/g, "\n").trim();
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// Le titre d'une section, sans sa numérotation, et le repère de temps qu'il porte (« (0 à 10 min) »).
function titreEtDuree(brut: string) {
  let titre = brut.replace(/\*\*|__/g, "").trim();
  let duree = "";
  const m = titre.match(/\s*[(\[]([^()\[\]]*\bmin(?:utes?)?\b[^()\[\]]*)[)\]]\s*$/i) ?? titre.match(/\s*(?:·|,|:|–|-)\s*((?:\d+\s*(?:à|-|–)\s*)?\d+\s*min(?:utes?)?\b.*)$/i);
  if (m && m.index !== undefined && m.index > 0) {
    duree = m[1].trim();
    titre = titre.slice(0, m.index).trim();
  }
  titre = titre.replace(/^(?:\d+|[IVX]+)\s*[.)\-–:]\s*/i, "").replace(/[\s:]+$/, "");
  return { titre: titre || brut.trim(), duree };
}

// Les blocs d'un texte de section : texte de conduite et textes marqués « à lire ».
export function blocsDe(contenu: string): BlocSeance[] {
  const blocs: BlocSeance[] = [];
  let texte: string[] = [];
  let integral: { titre: string; lignes: string[] } | null = null;
  const pousserTexte = () => {
    const t = texte.join("\n").trim();
    if (t) blocs.push({ type: "texte", contenu: t });
    texte = [];
  };
  for (const ligne of contenu.replace(/\r\n?/g, "\n").split("\n")) {
    if (integral) {
      if (FIN_A_LIRE.test(ligne)) {
        blocs.push({ type: "integral", titre: integral.titre, contenu: trimLignes(integral.lignes) });
        integral = null;
      } else integral.lignes.push(ligne);
      continue;
    }
    const d = ligne.match(DEBUT_A_LIRE);
    if (d) {
      pousserTexte();
      integral = { titre: d[1].trim(), lignes: [] };
    } else texte.push(ligne);
  }
  if (integral) blocs.push({ type: "integral", titre: integral.titre, contenu: trimLignes(integral.lignes) });
  pousserTexte();
  return blocs.filter((b) => b.contenu.trim());
}

// Retire les lignes vides au début et à la fin, sans toucher au reste (retours à la ligne gardés).
function trimLignes(lignes: string[]) {
  let a = 0;
  let b = lignes.length;
  while (a < b && !lignes[a].trim()) a++;
  while (b > a && !lignes[b - 1].trim()) b--;
  return lignes.slice(a, b).join("\n");
}

// Le niveau d'intertitre qui découpe la préparation en sections. Un titre unique en tête
// (« # Préparation, séance 11 ») est le titre du document, pas une section.
function niveauDesSections(lignes: string[]) {
  const niveaux: number[] = [];
  let dansBloc = false;
  for (const l of lignes) {
    if (DEBUT_A_LIRE.test(l)) dansBloc = true;
    else if (dansBloc && FIN_A_LIRE.test(l)) dansBloc = false;
    else if (!dansBloc) {
      const m = l.match(TITRE_MD);
      if (m) niveaux.push(m[1].length);
    }
  }
  if (!niveaux.length) return null;
  const min = Math.min(...niveaux);
  if (niveaux[0] === min && niveaux.filter((n) => n === min).length === 1) {
    const autres = niveaux.filter((n) => n > min);
    if (autres.length) return { niveau: Math.min(...autres), titreDocument: true };
  }
  return { niveau: min, titreDocument: false };
}

// La préparation découpée selon ses intertitres, dans l'ordre. Le texte avant le premier intertitre
// devient une première section (titrée du titre du document s'il y en a un).
export function decouper(preparation: string): SectionSeance[] {
  const lignes = preparation.replace(/\r\n?/g, "\n").split("\n");
  const niv = niveauDesSections(lignes);
  const brutes: { titre: string; lignes: string[] }[] = [];
  let courante: { titre: string; lignes: string[] } = { titre: "", lignes: [] };
  let dansBloc = false;
  for (const l of lignes) {
    if (DEBUT_A_LIRE.test(l)) dansBloc = true;
    else if (dansBloc && FIN_A_LIRE.test(l)) dansBloc = false;
    const m = !dansBloc && niv ? l.match(TITRE_MD) : null;
    if (m && m[1].length <= niv!.niveau) {
      if (m[1].length < niv!.niveau) {
        // Le titre du document : il nomme le texte d'ouverture.
        if (!courante.titre) courante.titre = m[2];
        continue;
      }
      brutes.push(courante);
      courante = { titre: m[2], lignes: [] };
    } else courante.lignes.push(l);
  }
  brutes.push(courante);

  return brutes
    .filter((s) => s.lignes.some((l) => l.trim()) || (s.titre && brutes.indexOf(s) > 0))
    .map((s, i) => {
      const { titre, duree } = titreEtDuree(s.titre || (i === 0 ? "Pour commencer" : "Section"));
      const contenu = s.lignes.join("\n");
      if (TITRE_A_LIRE.test(titre)) {
        // Toute la section se lit à voix haute : un seul bloc, marques retirées, mots gardés.
        const texte = trimLignes(contenu.split("\n").filter((l) => !DEBUT_A_LIRE.test(l) && !FIN_A_LIRE.test(l)));
        return { titre, duree, blocs: texte.trim() ? [{ type: "integral" as const, titre, contenu: texte }] : [] };
      }
      return { titre, duree, blocs: blocsDe(contenu) };
    });
}

// Pour les éditeurs : une section en Markdown, les textes à lire entourés de leurs marques.
export function versMarkdown(blocs: BlocSeance[]) {
  return blocs.map((b) => (b.type === "texte" ? b.contenu : `:::a-lire${b.titre ? ` ${b.titre}` : ""}\n${b.contenu}\n:::`)).join("\n\n");
}

// La préparation telle qu'elle se lit hors du mode en séance : la marque devient une ligne lisible.
export function preparationLisible(preparation: string) {
  return preparation
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => {
      const d = l.match(DEBUT_A_LIRE);
      if (d) return `**${NOM_INTEGRAL}${d[1].trim() ? ` · ${d[1].trim()}` : ""}**\n`;
      return FIN_A_LIRE.test(l) ? "" : l;
    })
    .join("\n");
}

// Les mots des parties à alléger (hors textes à lire en entier).
export const motsAAlleger = (sections: SectionSeance[]) => sections.reduce((n, s) => n + s.blocs.reduce((m, b) => m + (b.type === "texte" ? nombreDeMots(b.contenu) : 0), 0), 0);

// Un texte à lire est-il, mot pour mot, un passage de la préparation ?
export function passageDe(preparation: string, bloc: string) {
  const p = mots(preparation);
  const b = mots(bloc);
  if (!b.length) return false;
  for (let i = 0; i + b.length <= p.length; i++) {
    if (p[i] === b[0] && b.every((x, j) => p[i + j] === x)) return true;
  }
  return false;
}

export type Controle = { ok: true; part: number; message: string } | { ok: false; message: string };

// Les contrôles d'une version séance face à sa préparation :
// mêmes sections dans le même ordre, chaque texte à lire gardé mot pour mot, longueur à 60 % au moins.
export function controler(version: SectionSeance[], preparation: string): Controle {
  const source = decouper(preparation);
  if (version.length !== source.length || version.some((s, i) => s.titre !== source[i].titre)) {
    return { ok: false, message: "Les sections ne sont pas celles de la préparation, dans le même ordre." };
  }
  for (const [i, s] of source.entries()) {
    for (const b of s.blocs) {
      if (b.type !== "integral") continue;
      const garde = version[i].blocs.some((v) => v.type === "integral" && memesMots(b.contenu, v.contenu).ok && v.contenu === b.contenu);
      if (!garde) return { ok: false, message: `Un texte à lire en entier n’a pas été gardé mot pour mot (section « ${s.titre} »).` };
    }
  }
  for (const s of version) {
    for (const b of s.blocs) {
      if (b.type === "integral" && !passageDe(preparation, b.contenu)) return { ok: false, message: `Un texte à lire en entier n’est pas, mot pour mot, un passage de la préparation (section « ${s.titre} »).` };
    }
  }
  const avant = motsAAlleger(source);
  const apres = motsAAlleger(version);
  const part = avant ? apres / avant : 1;
  if (avant && part < 0.6) {
    return { ok: false, message: `Trop coupée : la version séance garde ${Math.round(part * 100)} % du texte de la préparation (60 % au moins).` };
  }
  return { ok: true, part, message: `Allégée de ${Math.max(0, Math.round((1 - part) * 100))} %, textes à lire gardés en entier.` };
}
