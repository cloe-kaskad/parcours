// Mise en forme à l'affichage d'un texte brut (retour d'Émilien importé du Drive, transcript) :
// aucun mot n'est changé, seulement la structure.
// - la première ligne est retirée quand elle répète le titre (« Retour Emilien – Déborah 10 ») ;
// - une ligne de tirets devient une séparation ;
// - l'amorce d'une ligne du type « Niki : » passe en gras ;
// - chaque ligne devient un paragraphe (les listes restent des listes).

const SEPARATION = /^\s*[-–—_=*~]{3,}\s*$/;
// Un prénom, ou deux ou trois mots à majuscule (« Niki : », « Marie Claire : »), pas une phrase.
const AMORCE = /^(\s*)([A-ZÀ-Ý][\p{L}'’-]*(?:\s+[A-ZÀ-Ý][\p{L}'’-]*){0,2})\s*:\s+(?=\S)/u;
const SEPARATION_EN_TETE = /^\s*[-–—_=*~]{3,}\s*(?=\S)/;
const LISTE = /^\s*(?:[-*•]\s|\d+[.)]\s)/;

function repeteLeTitre(ligne: string) {
  const l = ligne.trim();
  return l.length > 0 && l.length <= 90 && /^retour\b/i.test(l) && !/[.?!]$/.test(l);
}

export function texteStructure(brut: string, { titre = false }: { titre?: boolean } = {}) {
  const lignes = brut.replace(/\r\n?/g, "\n").split("\n");
  if (titre) {
    const premiere = lignes.findIndex((l) => l.trim());
    if (premiere >= 0 && repeteLeTitre(lignes[premiere])) lignes.splice(premiere, 1);
  }
  const blocs: string[] = [];
  let precedenteListe = false;
  for (let ligne of lignes) {
    if (!ligne.trim()) {
      precedenteListe = false;
      continue;
    }
    if (SEPARATION.test(ligne)) {
      blocs.push("\n\n---\n\n");
      precedenteListe = false;
      continue;
    }
    if (SEPARATION_EN_TETE.test(ligne)) {
      blocs.push("\n\n---\n\n");
      ligne = ligne.replace(SEPARATION_EN_TETE, "");
      precedenteListe = false;
    }
    const liste = LISTE.test(ligne);
    const texte = ligne.replace(AMORCE, (_, espace: string, nom: string) => `${espace}**${nom.trim()} :** `).trimEnd();
    blocs.push(blocs.length ? (liste && precedenteListe ? "\n" : "\n\n") : "", texte.trimStart());
    precedenteListe = liste;
  }
  return blocs.join("").replace(/\n{3,}/g, "\n\n").trim();
}

// Le retour d'Émilien tel qu'il s'affiche.
export const retourLisible = (contenu: string) => texteStructure(contenu, { titre: true });

// Contrôle de la version lisible d'un retour : les mêmes mots, dans le même ordre, que le texte d'origine.
// La mise en forme (gras, citations, listes, séparations) ne compte pas ; un intertitre ajouté
// (ligne « ## … ») est permis, à condition d'être en plus, jamais à la place d'un mot d'Émilien.
const mots = (ligne: string) => ligne.match(/[\p{L}\p{N}]+/gu) ?? [];

export function memesMots(origine: string, lisible: string): { ok: true } | { ok: false; ecart: string } {
  const attendus = mots(origine);
  const lignes = lisible
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => ({ titre: /^\s*#{1,6}\s/.test(l), mots: mots(l.replace(/^\s*(?:>\s*)*(?:[-*+]|\d+[.)])\s+/, "")) }))
    .filter((l) => l.mots.length);
  let pire = { i: -1, ecart: "" };
  // Un intertitre peut reprendre des mots d'Émilien ou être ajouté : on essaie les deux lectures.
  const suit = (n: number, i: number): boolean => {
    if (n === lignes.length) {
      if (i === attendus.length) return true;
      if (i > pire.i) pire = { i, ecart: `il manque la fin : « ${attendus.slice(i, i + 8).join(" ")} »` };
      return false;
    }
    const { titre, mots: m } = lignes[n];
    const k = m.findIndex((x, j) => attendus[i + j] !== x);
    if (k === -1 && suit(n + 1, i + m.length)) return true;
    if (titre && suit(n + 1, i)) return true;
    if (k !== -1 && i + k > pire.i) pire = { i: i + k, ecart: `« ${m.slice(Math.max(0, k - 3), k + 3).join(" ")} » au lieu de « ${attendus.slice(i + Math.max(0, k - 3), i + k + 3).join(" ")} »` };
    return false;
  };
  return suit(0, 0) ? { ok: true } : { ok: false, ecart: pire.ecart };
}

// Ce qu'on affiche d'un retour : la version lisible enregistrée (mêmes mots, contrôlée), sinon la mise en forme automatique.
export const texteRetour = (r: { contenu: string; contenu_lisible?: string | null }) => r.contenu_lisible?.trim() || retourLisible(r.contenu);
