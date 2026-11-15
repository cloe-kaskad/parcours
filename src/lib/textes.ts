// Les noms de sites qu'une page ajoute à la fin de son titre (« … - YouTube », « … | France Culture »).
const SITES = ["YouTube", "Spotify", "Apple Podcasts", "Podcasts Apple", "Deezer", "SoundCloud", "Vimeo", "Arte", "ARTE", "France Culture", "France Inter", "Radio France", "franceinfo", "Le Monde", "Le Monde.fr", "Libération", "Télérama", "Babelio", "Fnac", "Amazon.fr", "Amazon", "Instagram", "Facebook", "LinkedIn", "Medium", "Substack", "TED", "TED Talk"];
const FIN_SITE = new RegExp(`\\s*[|\\-\u2013\u2014:·]\\s*(?:${SITES.map((x) => x.replace(/[.]/g, "\\.")).join("|")})\\s*$`, "i");

// Titre lisible à partir d'un titre brut (nom de fichier, nom du site en fin de titre, tiret oublié en fin de ligne).
// `hote` : le site d'où vient le lien, retiré lui aussi de la fin du titre (« … | lesechos.fr »).
export function titrePropre(titre: string | null | undefined, hote?: string) {
  let t = (titre ?? "").trim();
  for (let i = 0; i < 2; i++) t = t.replace(FIN_SITE, "");
  if (hote) {
    const nom = hote.replace(/^www\./, "").replace(/[.]/g, "\\.");
    t = t.replace(new RegExp(`\\s*[|\\-\u2013\u2014:·]\\s*(?:www\\.)?${nom}\\s*$`, "i"), "");
  }
  return t
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
