import { Carte, Vide } from "@/components/ui";
import { exigerCliente } from "@/lib/auth";
import { mesEtapes, mesSeances, monParcours } from "@/lib/db/cliente";

export const metadata = { title: "Mon chemin" };

export default async function Chemin() {
  const profil = await exigerCliente();
  const parcours = await monParcours(profil.id);
  const [etapes, seances] = parcours ? await Promise.all([mesEtapes(parcours.id), mesSeances(parcours.id)]) : [[], []];
  const faites = seances.filter((s) => s.statut === "faite").length;

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <h1 className="text-4xl font-bold">Mon chemin</h1>
      </section>

      {parcours?.intention ? (
        <section className="bloc rounded-2xl bg-beige/60 p-6 md:p-8">
          <p className="text-xl leading-relaxed text-violet md:text-2xl">{parcours.intention}</p>
          {parcours.mots_cles.length ? (
            <ul className="mt-6 flex flex-wrap gap-3">
              {parcours.mots_cles.map((m) => (
                <li key={m} className="titre text-2xl font-bold uppercase tracking-wide text-rouge md:text-3xl">
                  {m}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <Carte titre="Les étapes">
        {!etapes.length ? (
          <Vide>
            {faites > 0
              ? `${faites} séance${faites > 1 ? "s" : ""} déjà traversée${faites > 1 ? "s" : ""}. Les étapes du chemin apparaîtront ici au fil du parcours.`
              : "Le chemin se dessine au fil des séances."}
          </Vide>
        ) : (
          <ol className="relative ml-3 border-l-2 border-beige pl-6">
            {etapes.map((e) => (
              <li key={e.id} className="relative mb-8 last:mb-0">
                <span
                  className={`absolute -left-[1.95rem] top-1 h-4 w-4 rounded-full border-2 ${
                    e.statut === "traversee" ? "border-violet bg-violet" : e.statut === "en_cours" ? "border-rouge bg-creme" : "border-beige bg-creme"
                  }`}
                />
                <h3 className={`text-xl font-bold ${e.statut === "a_venir" ? "text-gris" : ""}`}>{e.titre}</h3>
                {e.mots_cles.length ? (
                  <p className="mt-1 flex flex-wrap gap-2">
                    {e.mots_cles.map((m) => (
                      <span key={m} className="rounded-full bg-violet/10 px-2.5 py-0.5 text-sm font-medium text-violet">
                        {m}
                      </span>
                    ))}
                  </p>
                ) : null}
                {e.moments_forts ? <p className="mt-2 text-base leading-relaxed text-encre">{e.moments_forts}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </Carte>
    </div>
  );
}
