// Titre lisible à partir d'un titre brut (nom de fichier, tiret oublié en fin de ligne).
export function titrePropre(titre: string | null | undefined) {
  return (titre ?? "")
    .replace(/\.pdf$/i, "")
    .replace(/_/g, " ")
    .replace(/[\s\-\u2013\u2014:]+$/, "")
    .trim();
}

// Premières lignes d'un texte en Markdown, sans sa mise en forme, coupées à la fin d'un mot.
export function extrait(texte: string, longueur = 190) {
  const brut = texte
    .replace(/[#>*_\x60]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (brut.length <= longueur) return brut;
  return brut.slice(0, longueur).replace(/[\s,;:.]*\S*$/, "") + "…";
}
