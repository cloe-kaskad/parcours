import { exigerCliente } from "@/lib/auth";
import { dateCourte } from "@/lib/dates";
import { mesEtapes, mesSeances, monParcours } from "@/lib/db/cliente";

export const metadata = { title: "Mon chemin" };

// Le chemin : l'intention en tête, puis les stations. Celles qui restent à venir ne sont pas nommées,
// le parcours mène vers des endroits qu'on ne connaît pas encore.
export default async function Chemin() {
  const profil = await exigerCliente();
  const parcours = await monParcours(profil.id);
  const [etapes, seances] = parcours ? await Promise.all([mesEtapes(parcours.id), mesSeances(parcours.id)]) : [[], []];
  const faites = seances.filter((s) => s.statut === "faite");
  const traversees = etapes.filter((e) => e.statut !== "a_venir");
  const suivante = etapes.find((e) => e.statut === "a_venir");

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <h1 className="text-[2.4rem] font-bold md:text-5xl">Mon chemin</h1>
        {parcours?.date_debut ? <p className="italique mt-2 text-base text-creme/70">depuis le {dateCourte(parcours.date_debut)}</p> : null}
      </section>

      {parcours?.intention ? (
        <section className="bloc">
          <p className="max-w-2xl text-xl leading-snug text-creme md:text-2xl">{parcours.intention}</p>
          {parcours.mots_cles.length ? (
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1">
              {parcours.mots_cles.map((m) => (
                <li key={m} className="titre text-4xl font-bold leading-none text-rose md:text-6xl">
                  {m}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="bloc">
        {!traversees.length ? (
          <p className="max-w-md text-base leading-relaxed text-creme/70">
            {faites.length > 0
              ? `${faites.length} séance${faites.length > 1 ? "s" : ""} déjà vécue${faites.length > 1 ? "s" : ""}. Les mots du chemin apparaîtront ici au fil du parcours, avec Cloé.`
              : "Le chemin se dessine au fil des séances."}
          </p>
        ) : (
          <ol className="relative ml-2 border-l border-white/25 pl-7">
            {traversees.map((e, i) => (
              <li key={e.id} className="relative pb-10 last:pb-0">
                <span
                  className={`absolute -left-[2.05rem] top-1.5 h-3.5 w-3.5 rounded-full ${e.statut === "en_cours" ? "bg-rouge ring-4 ring-rouge/30" : "bg-creme"}`}
                  aria-hidden="true"
                />
                <p className="text-sm text-creme/60">
                  {i + 1}
                  {e.statut === "en_cours" ? " · en ce moment" : ""}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-creme">{e.titre}</h2>
                {e.mots_cles.length ? (
                  <p className="titre mt-2 text-3xl font-bold leading-[1.05] text-rose md:text-4xl">{e.mots_cles.join("  ")}</p>
                ) : null}
                {e.moments_forts ? <p className="mt-3 max-w-xl text-base leading-relaxed text-creme/85">{e.moments_forts}</p> : null}
              </li>
            ))}
            <li className="relative">
              <span className="absolute -left-[2.05rem] top-1.5 h-3.5 w-3.5 rounded-full border border-white/40" aria-hidden="true" />
              <p className="text-sm text-creme/60">{traversees.length + 1}</p>
              <h2 className="mt-1 text-2xl font-bold text-creme/60">{suivante ? suivante.titre : "Vers où on va, sans tout savoir encore"}</h2>
            </li>
          </ol>
        )}
      </section>
    </div>
  );
}
