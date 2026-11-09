// La lettre est un seul texte en Markdown. On y lit les exercices (un titre de niveau 2 ou 3 = un exercice)
// et les encadrés « Pourquoi ça compte » (une citation, ou un paragraphe qui commence par ces mots).
// Sans dépendance au serveur : le script de reconstitution des lettres s'en sert aussi.

export type Chapitre = { titre: string; slug: string; texte: string };
export type Lettre = { preambule: string; chapitres: Chapitre[] };

const MOTS_POURQUOI = "Pourquoi (?:ça compte|c['’]est important)";
const SANS_MARQUES = /[*_`#]/g;

export function sansMarkdown(texte: string) {
  return texte.replace(SANS_MARQUES, "").replace(/\s+/g, " ").trim();
}

// Identifiant stable tiré du titre : les notes survivent à une réécriture de la lettre.
export function slugTitre(titre: string) {
  return (
    sansMarkdown(titre)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "exercice"
  );
}

// Un paragraphe « Pourquoi ça compte » devient une citation, et le libellé est retiré :
// l'encadré l'affiche lui-même.
function normaliserEncadres(texte: string) {
  const blocs = texte.split(/\n{2,}/).map((b) => {
    const nu = b.trim();
    if (new RegExp(`^(?:\\*\\*|__)?\\p{Extended_Pictographic}?\\s*${MOTS_POURQUOI}`, "iu").test(nu)) {
      return nu
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
    }
    return b;
  });
  return blocs
    .join("\n\n")
    .replace(new RegExp(`^>[ \\t]*(?:\\*\\*|__)?\\p{Extended_Pictographic}?[ \\t]*${MOTS_POURQUOI}[ \\t]*(?:\\*\\*|__)?[ \\t]*:?[ \\t]*(?:\\*\\*|__)?[ \\t]*`, "gimu"), "> ");
}

export function lireLettre(contenu: string): Lettre {
  const lignes = contenu.replace(/\r\n/g, "\n").split("\n");
  const preambule: string[] = [];
  const chapitres: { titre: string; lignes: string[] }[] = [];
  let debut = true;

  for (const ligne of lignes) {
    const titre = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(ligne);
    if (titre && titre[1].length >= 2) {
      chapitres.push({ titre: sansMarkdown(titre[2]), lignes: [] });
    } else if (!(titre && debut)) {
      (chapitres.at(-1)?.lignes ?? preambule).push(ligne);
    }
    // Un titre de niveau 1 tout en haut répète le titre de la lettre : on l'ignore.
    if (ligne.trim() && !titre) debut = false;
  }

  const vus = new Map<string, number>();
  return {
    preambule: normaliserEncadres(preambule.join("\n").trim()),
    chapitres: chapitres.map((c) => {
      const base = slugTitre(c.titre);
      const n = (vus.get(base) ?? 0) + 1;
      vus.set(base, n);
      return { titre: c.titre, slug: n > 1 ? `${base}-${n}` : base, texte: normaliserEncadres(c.lignes.join("\n").trim()) };
    }),
  };
}
