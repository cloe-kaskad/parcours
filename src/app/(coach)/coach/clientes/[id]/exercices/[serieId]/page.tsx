import { notFound } from "next/navigation";
import { Formulaire } from "@/components/Formulaire";
import { Markdown } from "@/components/Markdown";
import { Bouton, Carte, Case, Champ, FilAriane, Pastille, Selection, Vide, Zone } from "@/components/ui";
import { ajouterPratique, mettreAJourPratique, mettreAJourSerie, publierSerie, supprimerPratique, supprimerSerie } from "@/lib/actions/pratiques";
import { dateCourte } from "@/lib/dates";
import { chargerSerie } from "@/lib/db/coach";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function PageExercices({ params }: PageProps<"/coach/clientes/[id]/exercices/[serieId]">) {
  const { id, serieId } = await params;
  const data = await chargerSerie(serieId);
  if (!data) notFound();
  const { serie, pratiques, seances, reponses } = data;
  const supabase = await createClient();
  const { data: cliente } = await supabase.from("profiles").select("prenom, nom").eq("id", id).maybeSingle<Pick<Profile, "prenom" | "nom">>();
  const seance = seances.find((s) => s.id === serie.seance_id);
  const titre = serie.titre || (seance ? `Après la séance ${seance.numero}` : "Exercices");

  return (
    <div className="flex flex-col gap-5">
      <section className="bloc">
        <FilAriane
          elements={[
            { href: "/coach/clientes", label: "Clientes" },
            { href: `/coach/clientes/${id}`, label: cliente?.prenom ?? "" },
            ...(seance ? [{ href: `/coach/clientes/${id}/seances/${seance.id}`, label: `Séance ${seance.numero}` }] : []),
            { label: "Exercices" },
          ]}
        />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold md:text-5xl">{titre}</h1>
          {serie.publiee_at ? <Pastille ton="ok">envoyés le {dateCourte(serie.publiee_at)}</Pastille> : <Pastille>brouillon</Pastille>}
        </div>
        <p className="mt-2 max-w-2xl text-base text-gris">
          Un mot d’accompagnement, puis les exercices un par un. {cliente?.prenom} ne voit rien tant que tu n’as pas cliqué sur « Envoyer ».
        </p>
      </section>

      <Carte titre="Mot d’accompagnement">
        <Formulaire action={mettreAJourSerie} bouton="Enregistrer" variante="secondaire">
          <input type="hidden" name="id" value={serie.id} />
          <input type="hidden" name="cliente_id" value={id} />
          <Zone
            label="Le texte qu’elle lit en premier (Markdown)"
            name="intro"
            rows={8}
            defaultValue={serie.intro}
            placeholder={`${cliente?.prenom ?? "Prénom"},\n\nVoici ce que je te propose pour les prochaines semaines…`}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <Champ label="Titre" name="titre" defaultValue={serie.titre} placeholder={titre} />
            <Selection label="Après la séance" name="seance_id" defaultValue={serie.seance_id ?? ""}>
              <option value="">aucune</option>
              {seances.map((s) => (
                <option key={s.id} value={s.id}>
                  Séance {s.numero} ({dateCourte(s.date)})
                </option>
              ))}
            </Selection>
            <Champ label="Signature" name="signature" defaultValue={serie.signature} />
          </div>
        </Formulaire>
      </Carte>

      {pratiques.map((p) => {
        const rep = reponses.find((r) => r.pratique_id === p.id);
        return (
          <Carte key={p.id} titre={`${p.ordre}. ${p.titre}`} action={p.bonus ? <Pastille ton="violet">bonus</Pastille> : null}>
            <Formulaire action={mettreAJourPratique} bouton="Enregistrer l’exercice" variante="secondaire">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="serie_id" value={serie.id} />
              <input type="hidden" name="cliente_id" value={id} />
              <div className="grid gap-4 md:grid-cols-[1fr_6rem]">
                <Champ label="Titre" name="titre" defaultValue={p.titre} />
                <Champ label="Ordre" name="ordre" type="number" min={1} defaultValue={p.ordre} />
              </div>
              <Zone label="Accroche : le moment de la séance d’où ça part" name="accroche" rows={2} defaultValue={p.accroche} />
              <Zone label="Consigne : quoi, quand, combien de temps, sous quelle forme" name="consigne" rows={5} defaultValue={p.consigne} />
              <Zone label="Règles (liste Markdown, une par ligne)" name="regles" rows={3} defaultValue={p.regles} placeholder={"- Règle 1\n- Règle 2"} />
              <Zone label="Pourquoi cet exercice" name="pourquoi" rows={4} defaultValue={p.pourquoi} />
              <Case label="Exercice bonus (optionnel)" name="bonus" defaultChecked={p.bonus} />
            </Formulaire>
            <form action={supprimerPratique} className="mt-2">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="serie_id" value={serie.id} />
              <input type="hidden" name="cliente_id" value={id} />
              <Bouton variante="danger" type="submit">
                Supprimer cet exercice
              </Bouton>
            </form>
            {rep?.contenu ? (
              <div className="mt-5 rounded-xl bg-surface-douce p-4">
                <p className="mb-2 text-xs font-semibold text-rouge">Sa réponse, {dateCourte(rep.updated_at)}</p>
                <Markdown>{rep.contenu}</Markdown>
              </div>
            ) : null}
          </Carte>
        );
      })}

      <div className="bloc">
        <form action={ajouterPratique}>
          <input type="hidden" name="serie_id" value={serie.id} />
          <input type="hidden" name="cliente_id" value={id} />
          <Bouton type="submit" variante="secondaire">
            {pratiques.length ? "Ajouter un exercice" : "Ajouter le premier exercice"}
          </Bouton>
        </form>
        {!pratiques.length ? <p className="mt-2 text-sm text-gris">Deux ou trois exercices par envoi, c’est le bon rythme.</p> : null}
      </div>

      <Carte titre={serie.publiee_at ? "Envoyés" : "Envoyer"}>
        {!pratiques.length ? (
          <Vide>Ajoute au moins un exercice avant d’envoyer.</Vide>
        ) : (
          <p className="text-base leading-relaxed">
            {serie.publiee_at
              ? `Visible dans l’espace de ${cliente?.prenom}. Tu peux encore corriger le texte, elle verra la version à jour.`
              : `${pratiques.length} exercice${pratiques.length > 1 ? "s" : ""} prêt${pratiques.length > 1 ? "s" : ""}. En envoyant, ils apparaissent dans son espace avec un champ de réponse sous chacun.`}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {pratiques.length ? (
            <Formulaire action={publierSerie} bouton={serie.publiee_at ? "Retirer de son espace" : `Envoyer à ${cliente?.prenom ?? "la cliente"}`} variante={serie.publiee_at ? "secondaire" : "primaire"} enLigne>
              <input type="hidden" name="id" value={serie.id} />
              <input type="hidden" name="cliente_id" value={id} />
              {serie.publiee_at ? <input type="hidden" name="depublier" value="1" /> : null}
            </Formulaire>
          ) : null}
          <form action={supprimerSerie}>
            <input type="hidden" name="id" value={serie.id} />
            <input type="hidden" name="cliente_id" value={id} />
            <Bouton variante="danger" type="submit">
              Supprimer cet envoi
            </Bouton>
          </form>
        </div>
      </Carte>
    </div>
  );
}
