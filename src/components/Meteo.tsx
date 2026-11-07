import { enregistrerMeteo } from "@/lib/actions/cliente";
import type { MeteoEtat, Musique } from "@/lib/db/cliente";
import type { Meteo as MeteoRow } from "@/lib/supabase/types";

// Météo du jour : sept mots, un geste. Puis une musique proposée et une note facultative.
export function Meteo({ etats, meteo, musiques }: { etats: MeteoEtat[]; meteo: MeteoRow | null; musiques: Musique[] }) {
  const courant = meteo ? etats.find((e) => e.code === meteo.etat_code) : null;
  const musique = courant ? musiques.find((m) => m.etat_code === courant.code) : null;

  return (
    <section className="bloc carte p-5 md:p-6">
      <h2 className="text-[1.35rem] font-bold">{courant ? "Ta météo du jour" : "Comment tu te sens, là, maintenant ?"}</h2>
      <form action={enregistrerMeteo} className="mt-4 flex flex-wrap gap-2">
        {etats.map((e) => {
          const on = courant?.code === e.code;
          return (
            <button
              key={e.code}
              type="submit"
              name="etat_code"
              value={e.code}
              aria-pressed={on}
              className={`titre rounded-full px-4 py-2 text-lg font-bold transition active:scale-[0.97] ${
                on ? "bg-violet text-creme" : "bg-violet/8 text-violet hover:bg-violet/15"
              }`}
            >
              {e.libelle}
            </button>
          );
        })}
      </form>

      {courant ? (
        <div className="mt-5 flex flex-col gap-4 border-t border-ligne pt-5">
          {musique ? (
            <p className="text-base">
              Une musique pour accompagner ce moment :{" "}
              <a href={musique.url} target="_blank" rel="noreferrer" className="font-semibold text-rouge underline-offset-4 hover:underline">
                {musique.titre}
                {musique.artiste ? `, ${musique.artiste}` : ""}
              </a>
            </p>
          ) : null}
          <form action={enregistrerMeteo} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input type="hidden" name="etat_code" value={courant.code} />
            <input
              type="text"
              name="note"
              defaultValue={meteo?.note ?? ""}
              maxLength={280}
              placeholder="Un mot de plus, si tu veux (Cloé le lit avant la séance)"
              className="flex-1 rounded-full border border-champ-bord bg-champ px-4 py-2 text-sm text-encre outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
            />
            <button type="submit" className="rounded-full bg-violet/8 px-4 py-2 text-sm font-semibold text-violet hover:bg-violet/15">
              Garder
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
