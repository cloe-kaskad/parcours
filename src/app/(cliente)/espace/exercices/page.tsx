import { Formulaire } from "@/components/Formulaire";
import { IconeFleche } from "@/components/Icones";
import { Markdown } from "@/components/Markdown";
import { Zone } from "@/components/ui";
import { repondrePratique } from "@/lib/actions/cliente";
import { exigerCliente } from "@/lib/auth";
import { avantOuverture, dateCourte } from "@/lib/dates";
import { mesSeances, mesSeries, monParcours } from "@/lib/db/cliente";
import { titrePropre } from "@/lib/textes";

export const metadata = { title: "Exercices" };

const resume = "flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden";

export default async function Exercices({ searchParams }: PageProps<"/espace/exercices">) {
  const { ouvrir } = await searchParams;
  const profil = await exigerCliente();
  const parcours = await monParcours(profil.id);
  const { series, pratiques, reponses } = parcours ? await mesSeries(parcours.id, profil.id) : { series: [], pratiques: [], reponses: [] };
  const seances = parcours ? await mesSeances(parcours.id) : [];

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <section className="bloc">
        <h1 className="text-[2.4rem] font-bold md:text-5xl">Exercices</h1>
        <p className="mt-2 max-w-md text-base leading-relaxed text-creme/70">
          À vivre entre les séances, pas seulement à comprendre. Les plus récents d’abord.
        </p>
      </section>

      {!series.length ? (
        <section className="bloc carte p-5 md:p-6">
          <p className="text-base leading-relaxed text-texte-doux">Pas encore d’exercice. Ils arrivent quelques jours après chaque séance.</p>
        </section>
      ) : (
        series.map((serie, index) => {
          const seance = seances.find((s) => s.id === serie.seance_id);
          const exercices = pratiques.filter((p) => p.serie_id === serie.id);
          const contexte = [
            seance ? `Après la séance ${seance.numero}` : "",
            avantOuverture(serie.publiee_at) ? "" : dateCourte(serie.publiee_at),
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <details key={serie.id} open={index === 0 || exercices.some((p) => p.id === ouvrir)} className="bloc group/serie">
              <summary className={`${resume} px-1`}>
                <div className="min-w-0">
                  {contexte ? <p className="text-sm text-creme/60">{contexte}</p> : null}
                  <h2 className="mt-1 text-2xl font-bold">{titrePropre(serie.titre) || "Exercices"}</h2>
                  <p className="mt-1 text-sm text-creme/60">
                    {exercices.length} exercice{exercices.length > 1 ? "s" : ""}
                  </p>
                </div>
                <IconeFleche className="mt-2 h-5 w-5 shrink-0 text-creme/70 transition group-open/serie:rotate-90" />
              </summary>

              <div className="mt-4 flex flex-col gap-4">
                {serie.intro ? (
                  <div className="carte p-5 md:p-6">
                    <Markdown className="text-[1.05rem]" titresDiscrets>
                      {serie.intro}
                    </Markdown>
                    {serie.signature ? <p className="italique mt-3 text-right text-base text-texte-doux">{serie.signature}</p> : null}
                  </div>
                ) : null}

                {exercices.map((p, i) => {
                  const rep = reponses.find((r) => r.pratique_id === p.id);
                  return (
                    <details key={p.id} id={p.id} open={(index === 0 && i === 0) || p.id === ouvrir} className="carte group/exercice scroll-mt-6 p-5 md:p-6">
                      <summary className={resume}>
                        <div className="min-w-0">
                          <h3 className="text-xl font-bold">
                            {titrePropre(p.titre) || `Exercice ${i + 1}`}
                            {p.bonus ? <span className="ml-2 align-middle text-xs font-semibold text-rouge">en bonus</span> : null}
                          </h3>
                          {rep?.contenu.trim() ? <p className="mt-1 text-sm text-texte-doux">Tu y as écrit quelque chose</p> : null}
                        </div>
                        <IconeFleche className="mt-1.5 h-4 w-4 shrink-0 text-gris transition group-open/exercice:rotate-90" />
                      </summary>

                      {p.accroche ? <p className="italique mt-2 text-base text-texte-doux">{p.accroche}</p> : null}
                      {p.consigne ? <Markdown titresDiscrets>{p.consigne}</Markdown> : null}
                      {p.regles ? (
                        <Markdown className="text-sm" titresDiscrets>
                          {p.regles}
                        </Markdown>
                      ) : null}
                      {p.pourquoi ? (
                        <details className="mt-3 rounded-xl bg-surface-douce p-4">
                          <summary className="cursor-pointer text-sm font-semibold text-violet">Pourquoi cet exercice</summary>
                          <Markdown className="mt-2 text-sm" titresDiscrets>
                            {p.pourquoi}
                          </Markdown>
                        </details>
                      ) : null}
                      <div className="mt-5 border-t border-ligne pt-4">
                        <Formulaire action={repondrePratique} bouton={rep?.contenu ? "Mettre à jour" : "Enregistrer"} variante="secondaire">
                          <input type="hidden" name="pratique_id" value={p.id} />
                          <Zone
                            label={rep?.contenu ? `Ce que tu as écrit (${dateCourte(rep.updated_at)})` : "Ce que tu as envie d’en garder"}
                            name="contenu"
                            rows={3}
                            defaultValue={rep?.contenu ?? ""}
                            placeholder="Quelques lignes, à ton rythme. Cloé les lit avant la séance."
                          />
                        </Formulaire>
                      </div>
                    </details>
                  );
                })}
              </div>
            </details>
          );
        })
      )}
    </div>
  );
}
