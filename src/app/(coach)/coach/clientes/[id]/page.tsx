import Link from "next/link";
import { notFound } from "next/navigation";
import { Formulaire } from "@/components/Formulaire";
import { Bouton, Carte, Case, Champ, FilAriane, Pastille, Selection, Vide, Zone } from "@/components/ui";
import { envoyerLienAcces, mettreAJourCliente, mettreAJourParcours } from "@/lib/actions/clientes";
import { creerSeance } from "@/lib/actions/seances";
import { creerSerie } from "@/lib/actions/pratiques";
import { affecterRessource, retirerAffectation } from "@/lib/actions/ressources";
import { dateCourte, dateHeure, joursDepuis } from "@/lib/dates";
import { chargerCliente } from "@/lib/db/coach";
import { TYPES_RESSOURCE } from "@/lib/supabase/types";

const STATUTS_SEANCE = { planifiee: "planifiée", faite: "faite", annulee: "annulée" } as const;

export default async function FicheCliente({ params }: PageProps<"/coach/clientes/[id]">) {
  const { id } = await params;
  const data = await chargerCliente(id);
  if (!data) notFound();
  const { profil, parcours, seances, series, affectations, ressources, journal, meteos } = data;

  const alertes: string[] = [];
  for (const s of seances) {
    if (s.statut !== "faite") continue;
    const j = joursDepuis(s.date) ?? 0;
    if (s.transcript_statut !== "pret" && j >= 1) alertes.push(`Séance ${s.numero} : transcript manquant (J+${j}).`);
    if (s.transcript_statut === "pret" && !s.envoye_emilien_at) alertes.push(`Séance ${s.numero} : transcript prêt, pas encore transmis à Émilien.`);
    if (!series.some((x) => x.seance_id === s.id && x.publiee_at) && j >= 7) alertes.push(`Séance ${s.numero} : pratiques non publiées (J+${j}).`);
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <FilAriane elements={[{ href: "/coach/clientes", label: "Clientes" }, { label: `${profil.prenom} ${profil.nom}` }]} />
        <h1 className="text-4xl font-bold">
          {profil.prenom} {profil.nom}
        </h1>
        <p className="mt-1 text-sm text-gris">{profil.email}</p>
      </section>

      {alertes.length ? (
        <section className="bloc rounded-2xl bg-rouge/10 p-5">
          <h2 className="text-base font-bold text-rouge">À faire</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-encre">
            {alertes.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {!parcours ? (
        <Carte titre="Parcours">
          <Vide>Aucun parcours. Recrée la cliente ou contacte Claude pour en ajouter un.</Vide>
        </Carte>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Carte titre="Séances" action={<Pastille ton="violet">{seances.length}</Pastille>}>
              {!seances.length ? (
                <Vide>Pas encore de séance.</Vide>
              ) : (
                <ul className="divide-y divide-beige">
                  {seances.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <Link href={`/coach/clientes/${id}/seances/${s.id}`} className="font-semibold text-violet hover:text-rouge">
                          Séance {s.numero}
                        </Link>
                        <p className="text-sm text-gris">{dateHeure(s.date)}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Pastille ton={s.statut === "faite" ? "ok" : s.statut === "annulee" ? "alerte" : "neutre"}>{STATUTS_SEANCE[s.statut]}</Pastille>
                        {s.transcript_statut === "pret" ? <Pastille ton="violet">transcript</Pastille> : null}
                        {series.some((x) => x.seance_id === s.id && x.publiee_at) ? <Pastille ton="violet">pratiques</Pastille> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-5 border-t border-beige pt-5">
                <h3 className="mb-3 text-base font-bold">Nouvelle séance</h3>
                <Formulaire action={creerSeance} bouton="Créer la séance" enLigne>
                  <input type="hidden" name="parcours_id" value={parcours.id} />
                  <input type="hidden" name="cliente_id" value={id} />
                  <Champ label="Date et heure" name="date" type="datetime-local" />
                  <Selection label="Statut" name="statut" defaultValue="planifiee">
                    <option value="planifiee">planifiée</option>
                    <option value="faite">faite</option>
                  </Selection>
                </Formulaire>
              </div>
            </Carte>

            <Carte titre="Lettres de pratiques" action={<Pastille ton="violet">{series.length}</Pastille>}>
              {!series.length ? (
                <Vide>Pas encore de pratiques.</Vide>
              ) : (
                <ul className="divide-y divide-beige">
                  {series.map((x) => {
                    const s = seances.find((se) => se.id === x.seance_id);
                    return (
                      <li key={x.id} className="flex items-center justify-between gap-3 py-3">
                        <div>
                          <Link href={`/coach/clientes/${id}/pratiques/${x.id}`} className="font-semibold text-violet hover:text-rouge">
                            {x.titre || "Sans titre"}
                          </Link>
                          <p className="text-sm text-gris">{s ? `Après la séance ${s.numero}` : "Non rattachée à une séance"}</p>
                        </div>
                        {x.publiee_at ? <Pastille ton="ok">publiée {dateCourte(x.publiee_at)}</Pastille> : <Pastille>brouillon</Pastille>}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-5 border-t border-beige pt-5">
                <h3 className="mb-3 text-base font-bold">Nouvelle lettre</h3>
                <Formulaire action={creerSerie} bouton="Créer la lettre" enLigne>
                  <input type="hidden" name="parcours_id" value={parcours.id} />
                  <input type="hidden" name="cliente_id" value={id} />
                  <Champ label="Titre" name="titre" placeholder="Pratiques après la séance 3" />
                  <Selection label="Après la séance" name="seance_id" defaultValue="">
                    <option value="">aucune</option>
                    {seances.map((s) => (
                      <option key={s.id} value={s.id}>
                        Séance {s.numero}
                      </option>
                    ))}
                  </Selection>
                </Formulaire>
              </div>
            </Carte>
          </div>

          <Carte titre="Ressources partagées">
            {!affectations.length ? (
              <Vide>Aucune ressource partagée pour l’instant.</Vide>
            ) : (
              <ul className="divide-y divide-beige">
                {affectations.map((a) => {
                  const r = ressources.find((x) => x.id === a.ressource_id);
                  return (
                    <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                      <div>
                        <p className="font-semibold text-violet">
                          {r?.titre ?? "Ressource supprimée"}{" "}
                          <span className="text-xs font-normal text-gris">{TYPES_RESSOURCE.find((t) => t.valeur === r?.type)?.libelle}</span>
                        </p>
                        {a.pourquoi ? <p className="text-sm text-encre">{a.pourquoi}</p> : null}
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
            <div className="mt-5 border-t border-beige pt-5">
              <h3 className="mb-3 text-base font-bold">Partager une ressource de la bibliothèque</h3>
              {!ressources.length ? (
                <Vide>
                  La bibliothèque est vide.{" "}
                  <Link href="/coach/ressources" className="text-rouge underline-offset-4 hover:underline">
                    Ajouter des ressources
                  </Link>
                </Vide>
              ) : (
                <Formulaire action={affecterRessource} bouton="Partager">
                  <input type="hidden" name="parcours_id" value={parcours.id} />
                  <input type="hidden" name="cliente_id" value={id} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Selection label="Ressource" name="ressource_id" required defaultValue="">
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
                  <Zone label="Pourquoi pour elle" name="pourquoi" placeholder="Deux ou trois lignes sur ce qui résonne avec son parcours." />
                </Formulaire>
              )}
            </div>
          </Carte>

          <div className="grid gap-6 lg:grid-cols-2">
            <Carte titre="Journal et notes pour la prochaine séance">
              {!journal.length ? (
                <Vide>Rien pour l’instant.</Vide>
              ) : (
                <ul className="flex flex-col gap-4">
                  {journal.map((j) => (
                    <li key={j.id} className="rounded-xl bg-creme p-4">
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
            <Carte titre="Météo des derniers jours">
              {!meteos.length ? (
                <Vide>Pas encore de météo.</Vide>
              ) : (
                <ul className="divide-y divide-beige text-sm">
                  {meteos.map((m) => (
                    <li key={m.id} className="flex gap-3 py-2">
                      <span className="w-24 shrink-0 text-gris">{dateCourte(m.date)}</span>
                      <span className="font-medium text-violet">{m.etat_code}</span>
                      <span className="text-encre">{m.note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Carte>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Carte titre="Parcours">
              <Formulaire action={mettreAJourParcours} bouton="Enregistrer" variante="secondaire">
                <input type="hidden" name="id" value={parcours.id} />
                <input type="hidden" name="cliente_id" value={id} />
                <Zone label="Intention du parcours" name="intention" defaultValue={parcours.intention} />
                <Champ
                  label="Mots clés (séparés par des virgules)"
                  name="mots_cles"
                  defaultValue={parcours.mots_cles.join(", ")}
                  aide="Les grands mots du chemin, affichés en évidence dans son espace."
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Champ label="Début" name="date_debut" type="date" defaultValue={parcours.date_debut ?? ""} />
                  <Selection label="Statut" name="statut" defaultValue={parcours.statut}>
                    <option value="actif">actif</option>
                    <option value="pause">en pause</option>
                    <option value="termine">terminé</option>
                  </Selection>
                </div>
              </Formulaire>
            </Carte>

            <Carte titre="Compte">
              <Formulaire action={mettreAJourCliente} bouton="Enregistrer" variante="secondaire">
                <input type="hidden" name="id" value={id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Champ label="Prénom" name="prenom" defaultValue={profil.prenom} />
                  <Champ label="Nom" name="nom" defaultValue={profil.nom} />
                </div>
                <Case label="Cliente active (visible dans le tableau de bord)" name="actif" defaultChecked={profil.actif} />
              </Formulaire>
              <div className="mt-5 border-t border-beige pt-5">
                <Formulaire action={envoyerLienAcces} bouton="Lui envoyer son lien d’accès" variante="secondaire">
                  <input type="hidden" name="email" value={profil.email} />
                  <p className="text-sm text-gris">
                    Envoie un email avec un lien de connexion à {profil.email}. Elle pourra ensuite en redemander un elle-même depuis la page de connexion.
                  </p>
                </Formulaire>
              </div>
            </Carte>
          </div>
        </>
      )}
    </div>
  );
}
