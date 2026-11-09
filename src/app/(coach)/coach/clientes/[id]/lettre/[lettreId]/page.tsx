import { notFound } from "next/navigation";
import { Barre, Colonne, PageCoach } from "@/components/coach/base";
import { TexteLettre } from "@/components/espace/TexteLettre";
import { EditeurLettre } from "@/components/coach/EditeurLettre";
import { exigerEquipe } from "@/lib/auth";
import { avantOuverture, jourEtMois } from "@/lib/dates";
import { chargerLettreCoach, texteSeance } from "@/lib/db/coach";
import { titrePropre } from "@/lib/textes";

export const metadata = { title: "Écrire la lettre" };

export default async function PageEditeur({ params }: PageProps<"/coach/clientes/[id]/lettre/[lettreId]">) {
  const profil = await exigerEquipe();
  const { id, lettreId } = await params;
  const d = await chargerLettreCoach(lettreId);
  if (!d || d.cliente.id !== id) notFound();
  const { lettre, cliente, seance, retours, carnet } = d;
  const date = (x: string | null) => (x && !avantOuverture(x) ? jourEtMois(x) : null);
  const texte = seance ? texteSeance(seance) : "";

  const sources = [
    {
      libelle: "Transcript",
      titre: seance ? [`Séance ${seance.numero}`, date(seance.date)].filter(Boolean).join(" · ") : "Pas encore de séance",
      texte: texte || (seance?.transcript_pdf_path ? "Le texte de cette séance est dans son PDF, sur la page de la séance." : "Pas de texte pour cette séance."),
    },
    {
      libelle: "Émilien",
      titre: retours[0] ? ["Son retour", date(retours[0].created_at)].filter(Boolean).join(" · ") : "Pas encore de retour",
      texte: retours.map((r) => r.contenu).join("\n\n") || "Rien pour l’instant.",
    },
    {
      libelle: "Carnet",
      titre: `Le carnet de ${cliente.prenom}`,
      texte: carnet.map((e) => `${e.pour_prochaine_seance ? "À aborder. " : ""}${e.contenu}`).join("\n\n") || "Rien pour l’instant.",
    },
  ];

  if (profil.role === "relecteur") {
    return (
      <PageCoach>
        <Barre retour={{ href: `/coach/clientes/${id}`, libelle: `Fiche de ${cliente.prenom}` }} />
        <Colonne className="gap-6 pb-16 pt-7">
          <h1 className="t-page text-violet">{titrePropre(lettre.titre)}</h1>
          <TexteLettre>{lettre.contenu || lettre.intro}</TexteLettre>
        </Colonne>
      </PageCoach>
    );
  }

  return (
    <PageCoach>
      <EditeurLettre
        id={lettre.id}
        prenom={cliente.prenom}
        titreInitial={titrePropre(lettre.titre)}
        contenuInitial={lettre.contenu || lettre.intro}
        dejaEnvoyee={Boolean(lettre.publiee_at)}
        retour={seance ? { href: `/coach/clientes/${id}/seances/${seance.id}`, libelle: `Séance ${seance.numero}` } : { href: `/coach/clientes/${id}`, libelle: `Fiche de ${cliente.prenom}` }}
        sources={sources}
      />
    </PageCoach>
  );
}
