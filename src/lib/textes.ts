// Titre lisible à partir d'un titre brut (nom de fichier, tiret oublié en fin de ligne).
export function titrePropre(titre: string | null | undefined) {
  return (titre ?? "")
    .replace(/\.pdf$/i, "")
    .replace(/_/g, " ")
    .replace(/[\s\-\u2013\u2014:]+$/, "")
    .trim();
}
