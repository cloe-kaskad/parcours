import { notFound } from "next/navigation";
import { Bandeau } from "@/components/espace/Bandeau";
import { Pratiques, type Bloc, type Note } from "@/components/espace/Pratiques";
import { exigerCliente } from "@/lib/auth";
import { avantOuverture, jourCalendrier, jourEtMois, prochaineSeance } from "@/lib/dates";
import { maLettre, mesSeances, monParcours } from "@/lib/db/cliente";
import { lireLettre } from "@/lib/lettre";
import { titreCliente, titrePropre } from "@/lib/textes";

export const metadata = { title: "Mes pratiques" };

const dateReelle = (d: string | null) => (d && !avantOuverture(d) ? jourEtMois(d) : null);

// « Mes pratiques » (docs/09, section 3) : la page serveur prépare, le composant Pratiques fait lire.
export default async function PageMesPratiques({ params }: PageProps<"/espace/pratiques/[id]">) {
  const { id } = await params;
  const profil = await exigerCliente();
  const donnees = await maLettre(id, profil.id);
  if (!donnees) notFound();
  const { lettre, exercices, notes, avant } = donnees;
  const parcours = await monParcours(profil.id);
  const prochaine = prochaineSeance(parcours ? await mesSeances(parcours.id) : []);

  const { preambule, chapitres } = lireLettre(lettre.contenu || lettre.intro);
  const versNote = (n: (typeof notes)[number]): Note => ({ id: n.id, date: n.date, contenu: n.contenu, aAborder: n.pour_prochaine_seance });
  // Les intertitres qui sont des exercices deviennent des exercices fermés ; les autres restent du texte, à leur place.
  const blocs: Bloc[] = chapitres.map((c) => {
    const exercice = exercices.find((e) => e.slug === c.slug);
    if (!exercice) return { type: "texte", titre: c.titre, texte: c.texte };
    const note = notes.find((n) => n.pratique_id === exercice.id);
    return { type: "exercice", id: exercice.id, titre: titrePropre(c.titre), bonus: Boolean(exercice.bonus), texte: c.texte, note: note ? versNote(note) : null };
  });

  return (
    <div className="papier papier-page flex flex-1 flex-col">
      <Bandeau prenom={profil.prenom} />
      <Pratiques
        serieId={lettre.id}
        titre={titreCliente(lettre.titre)}
        titreCourt={titrePropre(lettre.titre)}
        envoyee={dateReelle(lettre.publiee_at)}
        seanceAVenir={prochaine?.date ? jourCalendrier(prochaine.date) : null}
        motDeCloe={preambule}
        blocs={blocs}
        signature={lettre.signature?.trim() || null}
        notesLibres={notes.filter((n) => !n.pratique_id).map(versNote)}
        avant={avant.map((l) => ({ id: l.id, titre: titrePropre(l.titre), date: dateReelle(l.publiee_at) }))}
        prochaineSeance={prochaine?.date ? jourCalendrier(prochaine.date) : null}
      />
    </div>
  );
}
