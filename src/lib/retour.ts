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
