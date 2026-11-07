import { Formulaire } from "@/components/Formulaire";
import { Markdown } from "@/components/Markdown";
import { Zone } from "@/components/ui";
import { repondrePratique } from "@/lib/actions/cliente";
import { exigerCliente } from "@/lib/auth";
import { dateCourte } from "@/lib/dates";
import { mesSeances, mesSeries, monParcours } from "@/lib/db/cliente";

export const metadata = { title: "Exercices" };

export default async function Exercices() {
  const profil = await exigerCliente();
  const parcours = await monParcours(profil.id);
  const { series, pratiques, reponses } = parcours ? await mesSeries(parcours.id, profil.id) : { series: [], pratiques: [], reponses: [] };
  const seances = parcours ? await mesSeances(parcours.id) : [];

  return (
    <div className="flex flex-col gap-6">
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
          return (
            <article key={serie.id} className={`bloc flex flex-col gap-4 ${index > 0 ? "opacity-90" : ""}`}>
              <header className="px-1">
                <p className="text-sm text-creme/60">
                  {seance ? `Après la séance ${seance.numero}, ` : ""}
                  {dateCourte(serie.publiee_at)}
                </p>
                <h2 className="mt-1 text-2xl font-bold">{serie.titre || "Exercices"}</h2>
              </header>

              {serie.intro ? (
                <div className="carte p-5 md:p-6">
                  <Markdown className="text-[1.05rem]">{serie.intro}</Markdown>
                  {serie.signature ? <p className="italique mt-3 text-right text-base text-texte-doux">{serie.signature}</p> : null}
                </div>
              ) : null}

              {exercices.map((p) => {
                const rep = reponses.find((r) => r.pratique_id === p.id);
                return (
                  <section key={p.id} id={p.id} className="carte scroll-mt-6 p-5 md:p-6">
                    <h3 className="text-xl font-bold">
                      {p.titre}
                      {p.bonus ? <span className="ml-2 align-middle text-xs font-semibold text-rouge">en bonus</span> : null}
                    </h3>
                    {p.accroche ? <p className="italique mt-2 text-base text-texte-doux">{p.accroche}</p> : null}
                    {p.consigne ? <Markdown>{p.consigne}</Markdown> : null}
                    {p.regles ? <Markdown className="text-sm">{p.regles}</Markdown> : null}
                    {p.pourquoi ? (
                      <details className="mt-3 rounded-xl bg-surface-douce p-4">
                        <summary className="cursor-pointer text-sm font-semibold text-violet">Pourquoi cet exercice</summary>
                        <Markdown className="mt-2 text-sm">{p.pourquoi}</Markdown>
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
                  </section>
                );
              })}
            </article>
          );
        })
      )}
    </div>
  );
}
