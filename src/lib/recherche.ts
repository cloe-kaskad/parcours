// La recherche dans tout ce qui concerne une cliente : sans accents, sans majuscules.
// Les textes sont lus avec les droits de la personne connectée (Row Level Security) :
// une cliente ne pourrait jamais remonter un retour d'Émilien.

export type Document = { cliente: string; clienteId: string; source: "Transcript" | "Retour d’Émilien" | "Carnet" | "Pratiques"; titre: string; lien: string; texte: string; date: string | null };
export type Extrait = { avant: string; trouve: string; apres: string };
export type Resultat = Document & { extraits: Extrait[]; total: number };

// Minuscules sans accents ; chaque caractère garde sa place pour retrouver l'extrait d'origine.
function plier(s: string) {
  return [...s].map((c) => c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().charAt(0) || c).join("");
}

const nettoyer = (s: string) => s.replace(/[*_#>`]/g, "").replace(/\s+/g, " ");

export function chercher(documents: Document[], q: string, parDocument = 3): Resultat[] {
  const requete = plier(q.trim());
  if (requete.length < 2) return [];
  const resultats: Resultat[] = [];
  for (const d of documents) {
    const texte = nettoyer(d.texte);
    const plie = plier(texte);
    const extraits: Extrait[] = [];
    let total = 0;
    let i = plie.indexOf(requete);
    while (i !== -1) {
      total++;
      if (extraits.length < parDocument) {
        const debut = Math.max(0, texte.lastIndexOf(" ", Math.max(0, i - 70)) + 1);
        const fin = texte.indexOf(" ", Math.min(texte.length, i + requete.length + 90));
        extraits.push({
          avant: (debut > 0 ? "… " : "") + texte.slice(debut, i),
          trouve: texte.slice(i, i + requete.length),
          apres: texte.slice(i + requete.length, fin === -1 ? texte.length : fin) + (fin === -1 ? "" : " …"),
        });
      }
      i = plie.indexOf(requete, i + requete.length);
    }
    if (total) resultats.push({ ...d, extraits, total });
  }
  return resultats;
}
