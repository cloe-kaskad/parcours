import type { Exercice, Note } from "@/components/espace/Pratiques";
import { avantOuverture, jourComplet, jourEtHeure, jourEtMois, prochaineSeance } from "@/lib/dates";
import { maLettre, mesSeances, monParcours } from "@/lib/db/cliente";
import { descriptionExercice, lireLettre } from "@/lib/lettre";
import { titreCliente, titrePropre } from "@/lib/textes";

const dateReelle = (d: string | null) => (d && !avantOuverture(d) ? jourEtMois(d) : null);

// Ce que la page « Mes pratiques » montre : pour la cliente, et pour Cloé en aperçu (comme elle le voit).
export async function preparerPratiques(lettreId: string, clienteId: string, brouillonPermis = false) {
  const donnees = await maLettre(lettreId, clienteId, brouillonPermis);
  if (!donnees) return null;
  const { lettre, exercices, notes, avant } = donnees;
  const parcours = await monParcours(clienteId);
  const prochaine = prochaineSeance(parcours ? await mesSeances(parcours.id) : []);

  const { preambule, chapitres } = lireLettre(lettre.contenu || lettre.intro);
  const versNote = (n: (typeof notes)[number]): Note => ({ id: n.id, date: n.date, contenu: n.contenu, aAborder: n.pour_prochaine_seance });
  // Les intertitres qui sont des exercices deviennent des cartes ; les autres forment le mot de fin, après la liste.
  const liste: Exercice[] = [];
  const motDeFin: { titre: string; texte: string }[] = [];
  for (const c of chapitres) {
    const exercice = exercices.find((e) => e.slug === c.slug);
    if (!exercice) {
      motDeFin.push({ titre: c.titre, texte: c.texte });
      continue;
    }
    const note = notes.find((n) => n.pratique_id === exercice.id);
    liste.push({ id: exercice.id, titre: titrePropre(c.titre), bonus: Boolean(exercice.bonus), description: exercice.accroche.trim() || descriptionExercice(c.texte), texte: c.texte, note: note ? versNote(note) : null });
  }
  const envoyee = dateReelle(lettre.publiee_at);
  const dates = [envoyee ? `envoyées le ${envoyee}` : null, prochaine?.date ? `séance le ${jourEtHeure(prochaine.date).replace(" · ", " à ")}` : null].filter(Boolean).join(" · ");

  return {
    serieId: lettre.id,
    titre: titreCliente(lettre.titre),
    titreCourt: titrePropre(lettre.titre),
    dates,
    motDeCloe: preambule,
    exercices: liste,
    motDeFin,
    signature: lettre.signature?.trim() || null,
    notesLibres: notes.filter((n) => !n.pratique_id).map(versNote),
    avant: avant.map((l) => ({ id: l.id, titre: titrePropre(l.titre), date: dateReelle(l.publiee_at) })),
    prochaineSeance: prochaine?.date ? jourComplet(prochaine.date) : null,
    envoyee: Boolean(lettre.publiee_at),
  };
}
