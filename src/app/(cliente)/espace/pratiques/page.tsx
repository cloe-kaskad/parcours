import { Formulaire } from "@/components/Formulaire";
import { Markdown } from "@/components/Markdown";
import { Carte, Pastille, Vide, Zone } from "@/components/ui";
import { repondrePratique } from "@/lib/actions/cliente";
import { exigerCliente } from "@/lib/auth";
import { dateCourte } from "@/lib/dates";
import { mesSeances, mesSeries, monParcours } from "@/lib/db/cliente";

export const metadata = { title: "Pratiques" };

export default async function Pratiques() {
  const profil = await exigerCliente();
  const parcours = await monParcours(profil.id);
  const { series, pratiques, reponses } = parcours ? await mesSeries(parcours.id, profil.id) : { series: [], pratiques: [], reponses: [] };
  const seances = parcours ? await mesSeances(parcours.id) : [];

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <h1 className="text-4xl font-bold">Pratiques</h1>
        <p className="mt-2 max-w-xl text-base text-prune">
          Ce qui se vit entre les séances. La lettre la plus récente est en haut, les précédentes restent accessibles.
        </p>
      </section>

      {!series.length ? (
        <Carte>
          <Vide>Pas encore de pratiques. Elles arrivent après chaque séance.</Vide>
        </Carte>
      ) : (
        series.map((serie, index) => {
          const seance = seances.find((s) => s.id === serie.seance_id);
          const mesPratiques = pratiques.filter((p) => p.serie_id === serie.id);
          return (
            <article key={serie.id} className="bloc flex flex-col gap-5 rounded-2xl bg-white/70 p-6 md:p-8">
              <header>
                <p className="flex flex-wrap items-center gap-2 text-xs text-gris">
                  {seance ? <span>Après la séance {seance.numero}</span> : null}
                  <span>{dateCourte(serie.publiee_at)}</span>
                  {index === 0 ? <Pastille ton="violet">en cours</Pastille> : null}
                </p>
                <h2 className="mt-1 text-2xl font-bold">{serie.titre || "Lettre de pratiques"}</h2>
              </header>

              {serie.intro ? <Markdown className="text-[1.05rem]">{serie.intro}</Markdown> : null}

              <div className="flex flex-col gap-6">
                {mesPratiques.map((p) => {
                  const rep = reponses.find((r) => r.pratique_id === p.id);
                  return (
                    <section key={p.id} className="rounded-2xl border border-beige bg-creme/60 p-5">
                      <h3 className="text-xl font-bold">
                        {p.titre}
                        {p.bonus ? <span className="ml-2 align-middle text-xs font-normal uppercase tracking-wider text-rouge">bonus</span> : null}
                      </h3>
                      {p.accroche ? <p className="italique mt-2 text-base text-prune">{p.accroche}</p> : null}
                      {p.consigne ? <Markdown>{p.consigne}</Markdown> : null}
                      {p.regles ? <Markdown className="text-sm">{p.regles}</Markdown> : null}
                      {p.pourquoi ? (
                        <div className="mt-4 rounded-xl bg-beige/60 p-4">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-rouge">Pourquoi c’est important</p>
                          <Markdown className="text-sm">{p.pourquoi}</Markdown>
                        </div>
                      ) : null}
                      <div className="mt-5 border-t border-beige pt-4">
                        <Formulaire action={repondrePratique} bouton={rep ? "Mettre à jour" : "Enregistrer"} variante="secondaire">
                          <input type="hidden" name="pratique_id" value={p.id} />
                          <Zone
                            label={rep ? `Ta réponse (modifiée le ${dateCourte(rep.updated_at)})` : "Ta réponse, si tu as envie d’écrire ici"}
                            name="contenu"
                            rows={4}
                            defaultValue={rep?.contenu ?? ""}
                            placeholder="Quelques lignes, à ton rythme. Cloé les lit avant la séance."
                          />
                        </Formulaire>
                      </div>
                    </section>
                  );
                })}
              </div>

              {serie.signature ? <p className="text-right text-base text-prune">{serie.signature}</p> : null}
            </article>
          );
        })
      )}
    </div>
  );
}
