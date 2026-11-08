import Link from "next/link";
import { Meteo } from "@/components/Meteo";
import { IconeFleche } from "@/components/Icones";
import { exigerCliente } from "@/lib/auth";
import { dateHeure, prochaineSeance } from "@/lib/dates";
import { mesEtapes, mesSeances, mesSeries, meteoDuJour, monParcours } from "@/lib/db/cliente";
import { titrePropre } from "@/lib/textes";

function salutation() {
  const h = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(new Date()));
  return h < 5 ? "Bonne nuit" : h < 18 ? "Bonjour" : "Bonsoir";
}

export default async function Aujourdhui() {
  const profil = await exigerCliente();
  const parcours = await monParcours(profil.id);
  const [{ etats, meteo, musiques }, seances, { series, pratiques, reponses }, etapes] = await Promise.all([
    meteoDuJour(profil.id),
    parcours ? mesSeances(parcours.id) : Promise.resolve([]),
    parcours ? mesSeries(parcours.id, profil.id) : Promise.resolve({ series: [], pratiques: [], reponses: [] }),
    parcours ? mesEtapes(parcours.id) : Promise.resolve([]),
  ]);

  const prochaine = prochaineSeance(seances);
  const serie = series[0] ?? null;
  const exercices = serie ? pratiques.filter((p) => p.serie_id === serie.id) : [];
  const vecues = seances.filter((s) => s.statut === "faite").length;
  const motsRecents = [...etapes.filter((e) => e.statut !== "a_venir").flatMap((e) => e.mots_cles), ...(parcours?.mots_cles ?? [])].slice(-4);
  const dateDuJour = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(new Date());

  return (
    <div className="flex flex-col gap-5">
      <section className="bloc pb-1">
        <p className="italique text-base text-creme/70">{dateDuJour}</p>
        <h1 className="mt-1 text-[2.4rem] font-bold md:text-5xl">
          {salutation()} {profil.prenom}.
        </h1>
      </section>

      <Meteo etats={etats} meteo={meteo} musiques={musiques} />

      <section className="bloc carte p-5 md:p-6">
        <h2 className="text-[1.35rem] font-bold">En ce moment</h2>
        {!exercices.length ? (
          <p className="mt-2 text-base leading-relaxed text-texte-doux">Pas d’exercice en cours. Ils arrivent quelques jours après chaque séance.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ligne">
            {exercices.map((p, i) => {
              const fait = reponses.some((r) => r.pratique_id === p.id && r.contenu.trim());
              return (
                <li key={p.id}>
                  <Link href={`/espace/exercices?ouvrir=${p.id}#${p.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-encre/4">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${fait ? "border-violet bg-violet text-creme" : "border-violet/30"}`}
                      aria-hidden="true"
                    >
                      {fait ? (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="m6 12 4 4 8-8" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="flex-1 text-base font-medium">{titrePropre(p.titre) || `Exercice ${i + 1}`}</span>
                    <IconeFleche className="h-4 w-4 text-gris" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="bloc carte p-5 md:p-6">
          <h2 className="text-[1.35rem] font-bold">Prochaine séance</h2>
          <p className="mt-2 text-base leading-relaxed">{prochaine?.date ? dateHeure(prochaine.date) : "Pas encore de date. Cloé te la proposera bientôt."}</p>
          {prochaine ? (
            <Link href="/espace/journal" className="mt-3 inline-block text-sm font-semibold text-rouge underline-offset-4 hover:underline">
              Noter ce que je veux aborder
            </Link>
          ) : null}
        </section>

        <Link href="/espace/chemin" className="bloc flex flex-col rounded-[1.25rem] border border-white/15 p-5 transition hover:border-white/30 md:p-6">
          <h2 className="text-[1.35rem] font-bold text-creme">Mon chemin</h2>
          {motsRecents.length ? (
            <p className="titre mt-3 text-2xl font-bold leading-[1.1] text-rose">{motsRecents.join(" · ")}</p>
          ) : (
            <p className="mt-2 text-base text-creme/70">{vecues ? `${vecues} séance${vecues > 1 ? "s" : ""} déjà vécue${vecues > 1 ? "s" : ""}.` : "Il se dessine au fil des séances."}</p>
          )}
        </Link>
      </div>
    </div>
  );
}
