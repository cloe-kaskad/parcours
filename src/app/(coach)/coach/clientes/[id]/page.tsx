import Link from "next/link";
import { notFound } from "next/navigation";
import { Formulaire } from "@/components/Formulaire";
import { Bouton, Carte, Case, Champ, FilAriane, Ligne, Pastille, Selection, Vide, Zone } from "@/components/ui";
import { envoyerLienAcces, mettreAJourCliente, mettreAJourParcours } from "@/lib/actions/clientes";
import { creerEtape, mettreAJourEtape, supprimerEtape } from "@/lib/actions/etapes";
import { creerSerie } from "@/lib/actions/pratiques";
import { affecterRessource, retirerAffectation } from "@/lib/actions/ressources";
import { creerSeance } from "@/lib/actions/seances";
import { dateCourte, dateHeure, prochaineSeance } from "@/lib/dates";
import { chargerCliente } from "@/lib/db/coach";
import { TYPES_RESSOURCE } from "@/lib/supabase/types";

const STATUTS_ETAPE = { a_venir: "à venir", en_cours: "en ce moment", traversee: "traversée" } as const;

export default async function FicheCliente({ params }: PageProps<"/coach/clientes/[id]">) {
  const { id } = await params;
  const data = await chargerCliente(id);
  if (!data) notFound();
  const { profil, parcours, seances, series, affectations, ressources, journal, meteos, etapes } = data;
  const prochaine = prochaineSeance(seances);
  const pourSeance = journal.filter((j) => j.pour_prochaine_seance);

  return (
    <div className="flex flex-col gap-6">
      <section className="bloc">
        <FilAriane elements={[{ href: "/coach/clientes", label: "Clientes" }, { label: profil.prenom }]} />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold md:text-5xl">
              {profil.prenom} {profil.nom}
            </h1>
            <p className="mt-1 text-sm text-gris">
              {profil.email}
              {parcours?.date_debut ? ` · parcours depuis le ${dateCourte(parcours.date_debut)}` : ""}
              {prochaine ? ` · prochaine séance ${dateHeure(prochaine.date)}` : ""}
            </p>
          </div>
          <Formulaire action={envoyerLienAcces} bouton="Lui envoyer son lien d’accès" variante="secondaire" enLigne>
            <input type="hidden" name="email" value={profil.email} />
          </Formulaire>
        </div>
      </section>

      {!parcours ? (
        <Carte titre="Parcours">
          <Vide>Aucun parcours pour cette cliente.</Vide>
        </Carte>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
            <Carte titre="Séances">
              {!seances.length ? (
                <Vide>Pas encore de séance. Crée la première ci-dessous : c’est depuis la séance que tu déposes le transcript et prépares les exercices.</Vide>
              ) : (
                <ul>
                  {seances
                    .slice()
                    .reverse()
                    .map((s) => {
                      const ok = series.some((x) => x.seance_id === s.id && x.publiee_at);
                      return (
                        <Ligne
                          key={s.id}
                          href={`/coach/clientes/${id}/seances/${s.id}`}
                          aside={
                            s.statut === "faite" ? (
                              <>
                                <Pastille ton={s.transcript_statut === "pret" ? "ok" : "alerte"}>transcript</Pastille>
                                <Pastille ton={s.envoye_emilien_at ? "ok" : "neutre"}>Émilien</Pastille>
                                <Pastille ton={ok ? "ok" : "alerte"}>exercices</Pastille>
                              </>
                            ) : (
                              <Pastille ton={s.statut === "annulee" ? "neutre" : "violet"}>{s.statut === "annulee" ? "annulée" : "à venir"}</Pastille>
                            )
                          }
                        >
                          <p className="font-semibold text-violet">Séance {s.numero}</p>
                          <p className="text-sm text-gris">{dateHeure(s.date)}</p>
                        </Ligne>
                      );
                    })}
                </ul>
              )}
              <div className="mt-5 border-t border-ligne pt-5">
                <Formulaire action={creerSeance} bouton="Créer la séance" variante="secondaire" enLigne>
                  <input type="hidden" name="parcours_id" value={parcours.id} />
                  <input type="hidden" name="cliente_id" value={id} />
                  <Champ label="Nouvelle séance : date et heure" name="date" type="datetime-local" />
                  <Selection label="Statut" name="statut" defaultValue="planifiee">
                    <option value="planifiee">à venir</option>
                    <option value="faite">déjà faite</option>
                  </Selection>
                </Formulaire>
              </div>
            </Carte>

            <div className="flex flex-col gap-5">
              <Carte titre="Avant la prochaine séance">
                {pourSeance.length ? (
                  <ul className="flex flex-col gap-3">
                    {pourSeance.slice(0, 5).map((j) => (
                      <li key={j.id} className="rounded-xl bg-surface-douce p-3 text-sm leading-relaxed">
                        <span className="text-xs text-gris">{dateCourte(j.date)} </span>
                        {j.contenu}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Vide>Rien de noté « pour la prochaine séance » dans son journal.</Vide>
                )}
                {meteos.length ? (
                  <p className="mt-4 text-sm text-gris">
                    Météo récente :{" "}
                    {meteos
                      .slice(0, 5)
                      .map((m) => `${m.etat_code}${m.note ? ` (${m.note})` : ""}`)
                      .join(", ")}
                    .
                  </p>
                ) : null}
              </Carte>

              <Carte titre="Exercices">
                {!series.length ? (
                  <Vide>Aucun exercice envoyé. Ça se prépare depuis la page d’une séance.</Vide>
                ) : (
                  <ul>
                    {series.map((x) => {
                      const s = seances.find((se) => se.id === x.seance_id);
                      return (
                        <Ligne key={x.id} href={`/coach/clientes/${id}/exercices/${x.id}`} aside={x.publiee_at ? <Pastille ton="ok">envoyés</Pastille> : <Pastille>brouillon</Pastille>}>
                          <p className="font-semibold text-violet">{x.titre || (s ? `Après la séance ${s.numero}` : "Exercices")}</p>
                          <p className="text-sm text-gris">{x.publiee_at ? dateCourte(x.publiee_at) : "pas encore envoyés"}</p>
                        </Ligne>
                      );
                    })}
                  </ul>
                )}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gris hover:text-violet">Créer des exercices sans séance</summary>
                  <div className="mt-3">
                    <Formulaire action={creerSerie} bouton="Créer" variante="secondaire" enLigne>
                      <input type="hidden" name="parcours_id" value={parcours.id} />
                      <input type="hidden" name="cliente_id" value={id} />
                      <Champ label="Titre" name="titre" placeholder="Exercices d’été" />
                    </Formulaire>
                  </div>
                </details>
              </Carte>
            </div>
          </div>

          <Carte titre="Son chemin">
            <Formulaire action={mettreAJourParcours} bouton="Enregistrer l’intention" variante="secondaire">
              <input type="hidden" name="id" value={parcours.id} />
              <input type="hidden" name="cliente_id" value={id} />
              <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                <Zone label="Intention du parcours (ce qu’elle lit en premier)" name="intention" rows={3} defaultValue={parcours.intention} />
                <div className="flex flex-col gap-4">
                  <Champ label="Grands mots (séparés par des virgules)" name="mots_cles" defaultValue={parcours.mots_cles.join(", ")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Champ label="Début" name="date_debut" type="date" defaultValue={parcours.date_debut ?? ""} />
                    <Selection label="Statut" name="statut" defaultValue={parcours.statut}>
                      <option value="actif">actif</option>
                      <option value="pause">en pause</option>
                      <option value="termine">terminé</option>
                    </Selection>
                  </div>
                </div>
              </div>
            </Formulaire>

            <div className="mt-6 border-t border-ligne pt-5">
              <h3 className="mb-3 text-lg font-bold">Les étapes</h3>
              {!etapes.length ? <Vide>Pas encore d’étape. Ajoute-en une quand un mouvement se dessine en séance.</Vide> : null}
              <ol className="flex flex-col gap-3">
                {etapes.map((e) => (
                  <li key={e.id} className="rounded-xl bg-surface-douce p-4">
                    <details>
                      <summary className="flex cursor-pointer flex-wrap items-center gap-3">
                        <span className="font-semibold text-violet">
                          {e.ordre}. {e.titre}
                        </span>
                        {e.mots_cles.length ? <span className="text-sm text-rouge">{e.mots_cles.join(" · ")}</span> : null}
                        <Pastille ton={e.statut === "en_cours" ? "rose" : e.statut === "traversee" ? "ok" : "neutre"}>{STATUTS_ETAPE[e.statut]}</Pastille>
                      </summary>
                      <div className="mt-4">
                        <Formulaire action={mettreAJourEtape} bouton="Enregistrer" variante="secondaire">
                          <input type="hidden" name="id" value={e.id} />
                          <input type="hidden" name="cliente_id" value={id} />
                          <div className="grid gap-3 md:grid-cols-[5rem_1fr_1fr_10rem]">
                            <Champ label="Ordre" name="ordre" type="number" min={1} defaultValue={e.ordre} />
                            <Champ label="Titre" name="titre" defaultValue={e.titre} />
                            <Champ label="Mots clés" name="mots_cles" defaultValue={e.mots_cles.join(", ")} />
                            <Selection label="Statut" name="statut" defaultValue={e.statut}>
                              <option value="a_venir">à venir</option>
                              <option value="en_cours">en ce moment</option>
                              <option value="traversee">traversée</option>
                            </Selection>
                          </div>
                          <Zone label="Moments forts (ce qu’elle relit)" name="moments_forts" rows={2} defaultValue={e.moments_forts} />
                        </Formulaire>
                        <form action={supprimerEtape} className="mt-2">
                          <input type="hidden" name="id" value={e.id} />
                          <input type="hidden" name="cliente_id" value={id} />
                          <Bouton variante="danger" type="submit">
                            Supprimer l’étape
                          </Bouton>
                        </form>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
              <div className="mt-4">
                <Formulaire action={creerEtape} bouton="Ajouter l’étape" variante="secondaire">
                  <input type="hidden" name="parcours_id" value={parcours.id} />
                  <input type="hidden" name="cliente_id" value={id} />
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_10rem]">
                    <Champ label="Nouvelle étape" name="titre" placeholder="Ma voix, pas ma voix" />
                    <Champ label="Mots clés" name="mots_cles" placeholder="assise, permission" />
                    <Selection label="Statut" name="statut" defaultValue="en_cours">
                      <option value="a_venir">à venir</option>
                      <option value="en_cours">en ce moment</option>
                      <option value="traversee">traversée</option>
                    </Selection>
                  </div>
                </Formulaire>
              </div>
            </div>
          </Carte>

          <Carte titre="Ressources partagées">
            {!affectations.length ? (
              <Vide>Aucune ressource partagée.</Vide>
            ) : (
              <ul className="divide-y divide-ligne">
                {affectations.map((a) => {
                  const r = ressources.find((x) => x.id === a.ressource_id);
                  return (
                    <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                      <div>
                        <p className="font-semibold text-violet">
                          {r?.titre ?? "Ressource supprimée"} <span className="text-xs font-normal text-gris">{TYPES_RESSOURCE.find((t) => t.valeur === r?.type)?.libelle}</span>
                        </p>
                        {a.pourquoi ? <p className="text-sm">{a.pourquoi}</p> : null}
                      </div>
                      <form action={retirerAffectation}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="cliente_id" value={id} />
                        <Bouton variante="danger" type="submit">
                          Retirer
                        </Bouton>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-5 border-t border-ligne pt-5">
              {!ressources.length ? (
                <Vide>
                  La bibliothèque est vide.{" "}
                  <Link href="/coach/ressources" className="text-rouge underline-offset-4 hover:underline">
                    Ajouter des ressources
                  </Link>
                </Vide>
              ) : (
                <Formulaire action={affecterRessource} bouton="Partager avec elle" variante="secondaire">
                  <input type="hidden" name="parcours_id" value={parcours.id} />
                  <input type="hidden" name="cliente_id" value={id} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Selection label="Ressource de la bibliothèque" name="ressource_id" required defaultValue="">
                      <option value="" disabled>
                        Choisir…
                      </option>
                      {ressources.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.titre}
                          {r.auteur ? ` (${r.auteur})` : ""}
                        </option>
                      ))}
                    </Selection>
                    <Selection label="Liée à la séance" name="seance_id" defaultValue="">
                      <option value="">aucune</option>
                      {seances.map((s) => (
                        <option key={s.id} value={s.id}>
                          Séance {s.numero}
                        </option>
                      ))}
                    </Selection>
                  </div>
                  <Zone label="Pourquoi pour elle" name="pourquoi" rows={2} placeholder="Deux ou trois lignes sur ce qui résonne avec son parcours." />
                </Formulaire>
              )}
            </div>
          </Carte>

          <div className="grid gap-5 lg:grid-cols-2">
            <Carte titre="Journal complet">
              {!journal.length ? (
                <Vide>Rien pour l’instant.</Vide>
              ) : (
                <ul className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
                  {journal.map((j) => (
                    <li key={j.id} className="rounded-xl bg-surface-douce p-3">
                      <p className="mb-1 flex items-center gap-2 text-xs text-gris">
                        {dateCourte(j.date)}
                        {j.pour_prochaine_seance ? <Pastille ton="violet">pour la séance</Pastille> : null}
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{j.contenu}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Carte>
            <Carte titre="Compte">
              <Formulaire action={mettreAJourCliente} bouton="Enregistrer" variante="secondaire">
                <input type="hidden" name="id" value={id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Champ label="Prénom" name="prenom" defaultValue={profil.prenom} />
                  <Champ label="Nom" name="nom" defaultValue={profil.nom} />
                </div>
                <Case label="Cliente active (visible dans « À faire »)" name="actif" defaultChecked={profil.actif} />
              </Formulaire>
            </Carte>
          </div>
        </>
      )}
    </div>
  );
}
