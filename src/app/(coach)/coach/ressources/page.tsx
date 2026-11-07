import { Formulaire } from "@/components/Formulaire";
import { Bouton, Carte, Champ, Pastille, Selection, Vide, Zone } from "@/components/ui";
import { creerRessource, mettreAJourRessource, supprimerRessource } from "@/lib/actions/ressources";
import { createClient } from "@/lib/supabase/server";
import { TYPES_RESSOURCE, type Ressource } from "@/lib/supabase/types";

export const metadata = { title: "Ressources" };

export default async function Ressources() {
  const supabase = await createClient();
  const { data: ressources } = await supabase.from("ressources").select("*").order("created_at", { ascending: false }).returns<Ressource[]>();

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <h1 className="text-4xl font-bold">Bibliothèque de ressources</h1>
        <p className="mt-2 max-w-2xl text-base text-prune">
          Podcasts, vidéos, lectures, films. Tu les ajoutes ici une fois, puis tu les partages à une cliente depuis sa fiche, avec un mot pour elle.
        </p>
      </section>

      <Carte titre="Ajouter une ressource">
        <Formulaire action={creerRessource} bouton="Ajouter">
          <div className="grid gap-4 md:grid-cols-[10rem_1fr_1fr]">
            <Selection label="Type" name="type" defaultValue="podcast">
              {TYPES_RESSOURCE.map((t) => (
                <option key={t.valeur} value={t.valeur}>
                  {t.libelle}
                </option>
              ))}
            </Selection>
            <Champ label="Titre" name="titre" required />
            <Champ label="Auteur ou émission" name="auteur" />
          </div>
          <Champ label="Lien" name="url" type="url" placeholder="https://…" />
          <Zone label="Description courte" name="description" rows={2} />
        </Formulaire>
      </Carte>

      {!ressources?.length ? (
        <Carte>
          <Vide>La bibliothèque est vide.</Vide>
        </Carte>
      ) : (
        ressources.map((r) => (
          <Carte key={r.id} titre={r.titre} action={<Pastille ton="violet">{TYPES_RESSOURCE.find((t) => t.valeur === r.type)?.libelle}</Pastille>}>
            <Formulaire action={mettreAJourRessource} bouton="Enregistrer" variante="secondaire">
              <input type="hidden" name="id" value={r.id} />
              <div className="grid gap-4 md:grid-cols-[10rem_1fr_1fr]">
                <Selection label="Type" name="type" defaultValue={r.type}>
                  {TYPES_RESSOURCE.map((t) => (
                    <option key={t.valeur} value={t.valeur}>
                      {t.libelle}
                    </option>
                  ))}
                </Selection>
                <Champ label="Titre" name="titre" defaultValue={r.titre} />
                <Champ label="Auteur ou émission" name="auteur" defaultValue={r.auteur} />
              </div>
              <Champ label="Lien" name="url" type="url" defaultValue={r.url ?? ""} />
              <Zone label="Description courte" name="description" rows={2} defaultValue={r.description} />
            </Formulaire>
            <form action={supprimerRessource} className="mt-3">
              <input type="hidden" name="id" value={r.id} />
              <Bouton variante="danger" type="submit">
                Supprimer
              </Bouton>
            </form>
          </Carte>
        ))
      )}
    </div>
  );
}
