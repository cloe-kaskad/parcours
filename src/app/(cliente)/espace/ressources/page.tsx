import { Carte, Vide } from "@/components/ui";
import { changerStatutRessource } from "@/lib/actions/cliente";
import { exigerCliente } from "@/lib/auth";
import { mesRessources, monParcours } from "@/lib/db/cliente";
import { TYPES_RESSOURCE } from "@/lib/supabase/types";

export const metadata = { title: "Ressources" };

const STATUTS = [
  { valeur: "a_voir", libelle: "À découvrir" },
  { valeur: "commence", libelle: "Commencé" },
  { valeur: "termine", libelle: "Terminé" },
] as const;

export default async function Ressources() {
  const profil = await exigerCliente();
  const parcours = await monParcours(profil.id);
  const { affectations, ressources, suivis } = parcours
    ? await mesRessources(parcours.id, profil.id)
    : { affectations: [], ressources: [], suivis: [] };

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <h1 className="text-[2.4rem] font-bold md:text-5xl">Ressources choisies</h1>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-creme/70">
          Podcasts, vidéos, lectures : choisis pour toi, avec un mot sur pourquoi. Tu peux noter où tu en es.
        </p>
      </section>

      {!affectations.length ? (
        <Carte>
          <Vide>Rien pour l’instant.</Vide>
        </Carte>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {affectations.map((a) => {
            const r = ressources.find((x) => x.id === a.ressource_id);
            if (!r) return null;
            const statut = suivis.find((s) => s.affectation_id === a.id)?.statut ?? "a_voir";
            return (
              <article key={a.id} className="bloc carte flex flex-col gap-3 p-5 md:p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-rouge">{TYPES_RESSOURCE.find((t) => t.valeur === r.type)?.libelle}</p>
                <h2 className="text-xl font-bold">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer" className="hover:text-rouge">
                      {r.titre}
                    </a>
                  ) : (
                    r.titre
                  )}
                </h2>
                {r.auteur ? <p className="-mt-2 text-sm text-texte-doux">{r.auteur}</p> : null}
                {a.pourquoi ? <p className="text-base leading-relaxed">{a.pourquoi}</p> : r.description ? <p className="text-base">{r.description}</p> : null}
                <form action={changerStatutRessource} className="mt-auto flex flex-wrap gap-2 pt-2">
                  <input type="hidden" name="affectation_id" value={a.id} />
                  {STATUTS.map((s) => (
                    <button
                      key={s.valeur}
                      type="submit"
                      name="statut"
                      value={s.valeur}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        statut === s.valeur ? "bg-violet text-white" : "bg-violet/8 text-violet hover:bg-violet/15"
                      }`}
                    >
                      {s.libelle}
                    </button>
                  ))}
                </form>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
