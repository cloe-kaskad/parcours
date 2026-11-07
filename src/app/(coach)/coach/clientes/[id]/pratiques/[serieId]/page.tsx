import { notFound } from "next/navigation";
import { Formulaire } from "@/components/Formulaire";
import { Markdown } from "@/components/Markdown";
import { Bouton, Carte, Case, Champ, FilAriane, Pastille, Selection, Vide, Zone } from "@/components/ui";
import { ajouterPratique, mettreAJourPratique, mettreAJourSerie, publierSerie, supprimerPratique, supprimerSerie } from "@/lib/actions/pratiques";
import { dateCourte } from "@/lib/dates";
import { chargerSerie } from "@/lib/db/coach";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function PageSerie({ params }: PageProps<"/coach/clientes/[id]/pratiques/[serieId]">) {
  const { id, serieId } = await params;
  const data = await chargerSerie(serieId);
  if (!data) notFound();
  const { serie, pratiques, seances, reponses } = data;
  const supabase = await createClient();
  const { data: cliente } = await supabase.from("profiles").select("prenom, nom").eq("id", id).maybeSingle<Pick<Profile, "prenom" | "nom">>();

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <FilAriane
          elements={[
            { href: "/coach/clientes", label: "Clientes" },
            { href: `/coach/clientes/${id}`, label: `${cliente?.prenom ?? ""} ${cliente?.nom ?? ""}`.trim() },
            { label: serie.titre || "Lettre de pratiques" },
          ]}
        />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold">{serie.titre || "Lettre de pratiques"}</h1>
          {serie.publiee_at ? <Pastille ton="ok">publiée le {dateCourte(serie.publiee_at)}</Pastille> : <Pastille>brouillon</Pastille>}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Carte titre="La lettre">
          <Formulaire action={mettreAJourSerie} bouton="Enregistrer" variante="secondaire">
            <input type="hidden" name="id" value={serie.id} />
            <input type="hidden" name="cliente_id" value={id} />
            <Champ label="Titre" name="titre" defaultValue={serie.titre} />
            <Selection label="Après la séance" name="seance_id" defaultValue={serie.seance_id ?? ""}>
              <option value="">aucune</option>
              {seances.map((s) => (
                <option key={s.id} value={s.id}>
                  Séance {s.numero} ({dateCourte(s.date)})
                </option>
              ))}
            </Selection>
            <Zone
              label="Introduction (Markdown)"
              name="intro"
              rows={10}
              defaultValue={serie.intro}
              placeholder={`${cliente?.prenom ?? "Prénom"},\n\nVoici les pratiques pour les prochaines semaines…`}
            />
            <Champ label="Signature" name="signature" defaultValue={serie.signature} />
          </Formulaire>
        </Carte>

        <Carte titre="Publication">
          <p className="text-sm leading-relaxed text-encre">
            Tant que la lettre est en brouillon, {cliente?.prenom ?? "la cliente"} ne la voit pas. En la publiant, elle apparaît dans son espace
            avec un champ de réponse sous chaque pratique.
          </p>
          <div className="mt-4">
            <Formulaire action={publierSerie} bouton={serie.publiee_at ? "Retirer de son espace" : "Publier dans son espace"} variante={serie.publiee_at ? "secondaire" : "primaire"}>
              <input type="hidden" name="id" value={serie.id} />
              <input type="hidden" name="cliente_id" value={id} />
              {serie.publiee_at ? <input type="hidden" name="depublier" value="1" /> : null}
            </Formulaire>
          </div>
          <form action={supprimerSerie} className="mt-6 border-t border-beige pt-4">
            <input type="hidden" name="id" value={serie.id} />
            <input type="hidden" name="cliente_id" value={id} />
            <Bouton variante="danger" type="submit">
              Supprimer la lettre
            </Bouton>
          </form>
        </Carte>
      </div>

      <section className="bloc flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pratiques</h2>
        <form action={ajouterPratique}>
          <input type="hidden" name="serie_id" value={serie.id} />
          <input type="hidden" name="cliente_id" value={id} />
          <Bouton type="submit" variante="secondaire">
            Ajouter une pratique
          </Bouton>
        </form>
      </section>

      {!pratiques.length ? (
        <Carte>
          <Vide>Aucune pratique dans cette lettre. Ajoute la première.</Vide>
        </Carte>
      ) : (
        pratiques.map((p) => {
          const rep = reponses.find((r) => r.pratique_id === p.id);
          return (
            <Carte key={p.id} titre={`${p.ordre}. ${p.titre}`} action={p.bonus ? <Pastille ton="violet">bonus</Pastille> : null}>
              <Formulaire action={mettreAJourPratique} bouton="Enregistrer la pratique" variante="secondaire">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="serie_id" value={serie.id} />
                <input type="hidden" name="cliente_id" value={id} />
                <div className="grid gap-4 md:grid-cols-[1fr_6rem]">
                  <Champ label="Titre" name="titre" defaultValue={p.titre} />
                  <Champ label="Ordre" name="ordre" type="number" min={1} defaultValue={p.ordre} />
                </div>
                <Zone label="Accroche (le moment de la séance d’où ça part)" name="accroche" rows={3} defaultValue={p.accroche} />
                <Zone label="Consigne (quoi faire, quand, combien de temps, sous quelle forme)" name="consigne" rows={5} defaultValue={p.consigne} />
                <Zone label="Règles (une par ligne, en liste Markdown)" name="regles" rows={3} defaultValue={p.regles} placeholder={"- Règle 1\n- Règle 2"} />
                <Zone label="Pourquoi c’est important" name="pourquoi" rows={5} defaultValue={p.pourquoi} />
                <Case label="Pratique bonus (optionnelle)" name="bonus" defaultChecked={p.bonus} />
              </Formulaire>
              <form action={supprimerPratique} className="mt-3">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="serie_id" value={serie.id} />
                <input type="hidden" name="cliente_id" value={id} />
                <Bouton variante="danger" type="submit">
                  Supprimer cette pratique
                </Bouton>
              </form>
              {rep ? (
                <div className="mt-5 rounded-xl bg-creme p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rouge">Sa réponse, {dateCourte(rep.updated_at)}</p>
                  <Markdown>{rep.contenu}</Markdown>
                </div>
              ) : null}
            </Carte>
          );
        })
      )}
    </div>
  );
}
