import { Markdown } from "@/components/Markdown";
import { Carte, Pastille, Vide } from "@/components/ui";
import { exigerCliente } from "@/lib/auth";
import { dateHeure } from "@/lib/dates";
import { mesSeances, monParcours } from "@/lib/db/cliente";
import { urlSignee } from "@/lib/fichiers";

export const metadata = { title: "Séances" };

export default async function Seances() {
  const profil = await exigerCliente();
  const parcours = await monParcours(profil.id);
  const seances = parcours ? await mesSeances(parcours.id) : [];
  const liens = await Promise.all(
    seances.map(async (s) => (s.transcript_pdf_path ? await urlSignee("transcripts", s.transcript_pdf_path) : null)),
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <h1 className="text-4xl font-bold">Mémoire des séances</h1>
        <p className="mt-2 max-w-xl text-base text-prune">Chaque séance, avec sa date et son transcript quand il est prêt.</p>
      </section>

      {!seances.length ? (
        <Carte>
          <Vide>Pas encore de séance.</Vide>
        </Carte>
      ) : (
        seances
          .slice()
          .reverse()
          .map((s, i) => {
            const pdf = liens[seances.length - 1 - i];
            return (
              <Carte
                key={s.id}
                titre={`Séance ${s.numero}`}
                action={
                  s.statut === "planifiee" ? <Pastille>à venir</Pastille> : s.statut === "annulee" ? <Pastille>annulée</Pastille> : null
                }
              >
                <p className="text-base text-prune">{dateHeure(s.date)}</p>
                {pdf ? (
                  <p className="mt-3 text-sm">
                    <a href={pdf} target="_blank" rel="noreferrer" className="font-medium text-rouge underline-offset-4 hover:underline">
                      Ouvrir le transcript (PDF)
                    </a>
                  </p>
                ) : null}
                {s.transcript_formate ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-violet">Lire le transcript</summary>
                    <div className="mt-3">
                      <Markdown>{s.transcript_formate}</Markdown>
                    </div>
                  </details>
                ) : null}
                {!pdf && !s.transcript_formate && s.statut === "faite" ? (
                  <p className="mt-3 text-sm text-gris">Le transcript arrive bientôt.</p>
                ) : null}
              </Carte>
            );
          })
      )}
    </div>
  );
}
