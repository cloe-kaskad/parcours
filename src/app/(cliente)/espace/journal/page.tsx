import { Formulaire } from "@/components/Formulaire";
import { Bouton, Carte, Case, Champ, Pastille, Vide, Zone } from "@/components/ui";
import { ecrireJournal, supprimerJournal } from "@/lib/actions/cliente";
import { exigerCliente } from "@/lib/auth";
import { dateLongue } from "@/lib/dates";
import { monJournal } from "@/lib/db/cliente";

export const metadata = { title: "Journal" };

export default async function Journal() {
  const profil = await exigerCliente();
  const entrees = await monJournal(profil.id);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <h1 className="text-4xl font-bold">Journal</h1>
        <p className="mt-2 max-w-xl text-base text-prune">
          Ce qui se passe entre les séances, daté. Coche « pour la prochaine séance » quand c’est quelque chose que tu veux aborder.
        </p>
      </section>

      <Carte titre="Nouvelle entrée">
        <Formulaire action={ecrireJournal} bouton="Ajouter">
          <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
            <Champ label="Date" name="date" type="date" defaultValue={aujourdhui} />
            <div className="flex items-end pb-2">
              <Case label="Pour la prochaine séance" name="pour_prochaine_seance" />
            </div>
          </div>
          <Zone label="Ce que tu veux garder" name="contenu" rows={5} placeholder="Une situation, une sensation, une décision, un mot qui est revenu…" />
        </Formulaire>
      </Carte>

      {!entrees.length ? (
        <Carte>
          <Vide>Le journal est vide pour l’instant.</Vide>
        </Carte>
      ) : (
        entrees.map((e) => (
          <Carte key={e.id} titre={dateLongue(e.date)} action={e.pour_prochaine_seance ? <Pastille ton="violet">pour la prochaine séance</Pastille> : null}>
            <details>
              <summary className="cursor-pointer">
                <span className="whitespace-pre-wrap text-base leading-relaxed">{e.contenu}</span>
                <span className="mt-2 block text-xs text-gris">Modifier</span>
              </summary>
              <div className="mt-4 border-t border-beige pt-4">
                <Formulaire action={ecrireJournal} bouton="Enregistrer" variante="secondaire">
                  <input type="hidden" name="id" value={e.id} />
                  <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
                    <Champ label="Date" name="date" type="date" defaultValue={e.date} />
                    <div className="flex items-end pb-2">
                      <Case label="Pour la prochaine séance" name="pour_prochaine_seance" defaultChecked={e.pour_prochaine_seance} />
                    </div>
                  </div>
                  <Zone label="Texte" name="contenu" rows={5} defaultValue={e.contenu} />
                </Formulaire>
                <form action={supprimerJournal} className="mt-2">
                  <input type="hidden" name="id" value={e.id} />
                  <Bouton variante="danger" type="submit">
                    Supprimer
                  </Bouton>
                </form>
              </div>
            </details>
          </Carte>
        ))
      )}
    </div>
  );
}
