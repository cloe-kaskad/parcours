import Image from "next/image";
import Link from "next/link";
import { Deconnexion } from "@/components/Deconnexion";
import { notFound } from "next/navigation";
import { Depliant, DepotFichier, FormAction, Confirmer } from "@/components/coach/interactifs";
import { EnvoiLienAcces } from "@/components/coach/EnvoiLienAcces";
import { NoteOutil, Outils } from "@/components/coach/base";
import { CarteRessource } from "@/components/espace/CarteRessource";
import { CarteSeance } from "@/components/espace/CarteSeance";
import { Couverture } from "@/components/espace/Couverture";
import { EntreeCarnet } from "@/components/espace/EntreeCarnet";
import { ProchaineSeance } from "@/components/espace/ProchaineSeance";
import { TraceChemin } from "@/components/espace/TraceChemin";
import { ZoneLettre } from "@/components/espace/ZoneLettre";
import { ZoneMeteo } from "@/components/espace/ZoneMeteo";
import { choisirCouverture, couvertureDeposee, modifierFiche, modifierIntention, noteEmilienDeposee, relierDrive } from "@/lib/actions/clientes";
import { creerLettre, retirerLettre } from "@/lib/actions/lettres";
import { partagerRessource, retirerPartage } from "@/lib/actions/ressources";
import { creerSeance, enregistrerChemin } from "@/lib/actions/seances";
import { exigerEquipe } from "@/lib/auth";
import { BANQUE_COUVERTURES, urlCouverture } from "@/lib/couvertures";
import { avantOuverture, jourEtMois, jourEtMoisCourt, prochaineSeance } from "@/lib/dates";
import { cartesRessources, entreesCarnet, lettreEnCours, meteoDuJour, monParcours } from "@/lib/db/cliente";
import { complementFiche } from "@/lib/db/coach";
import { lireLettre } from "@/lib/lettre";
import { origineEntree } from "@/lib/ressources";
import { extrait, titrePropre } from "@/lib/textes";

export const metadata = { title: "Voir comme elle" };

// Son espace tel qu'elle le voit, avec les outils de Cloé posés sur les zones (ouvert par « Voir comme elle »).
export default async function VoirCommeElle({ params }: PageProps<"/coach/clientes/[id]/espace">) {
  const moi = await exigerEquipe();
  const estCoach = moi.role === "coach";
  const { id } = await params;
  const parcours = await monParcours(id);
  const { profil, notes, bibliotheque, brouillons, seances } = await complementFiche(id, parcours?.id ?? null);
  if (!profil || profil.role !== "cliente") notFound();
  const [{ etats, meteo, traces, musiques }, enCours, carnet, cartes] = await Promise.all([
    meteoDuJour(id),
    parcours ? lettreEnCours(parcours.id, id) : Promise.resolve(null),
    entreesCarnet(id),
    parcours ? cartesRessources(parcours.id, id) : Promise.resolve([]),
  ]);

  const parNumero = [...seances].reverse();
  const faites = parNumero.filter((s) => s.statut === "faite");
  const derniere = faites.at(-1);
  const prochaine = prochaineSeance(parNumero);
  const point = derniere && prochaine ? `entre la séance ${derniere.numero} et la séance ${prochaine.numero}` : null;
  const nomDe = (code: string) => etats.find((e) => e.code === code)?.libelle ?? "";
  const traceTextes = traces.map((t) => `${nomDe(t.etat_code)} · ${jourEtMoisCourt(t.date)}`);
  const envoyeeLe = enCours?.lettre.publiee_at && !avantOuverture(enCours.lettre.publiee_at) ? jourEtMois(enCours.lettre.publiee_at) : null;
  const carteSeance = (s: (typeof seances)[number]) => <CarteSeance key={s.id} numero={s.numero} date={s.date} mots={s.mots_cles} lien={estCoach ? `/coach/clientes/${id}/seances/${s.id}` : `/emilien/seances/${s.id}`} libelle="Ouvrir la séance" />;

  return (
    <>
      <div className="papier papier-page flex min-h-[44px] items-center justify-between px-[22px] py-1 md:px-10">
        <Link href={`/coach/clientes/${id}`} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-violet">
          ← Vue équipe
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-italique text-[13px] italic text-violet">comme elle le voit</span>
          <Deconnexion className="text-violet/70" />
        </div>
      </div>

      <Couverture url={urlCouverture(parcours?.couverture_path ?? null)} prenom={profil.prenom} />
      <TraceChemin stations={faites.map((s) => ({ id: s.id, nom: s.station_validee ?? s.mots_cles[0] ?? null }))} graine={parcours?.id ?? id} />

      <div className="flex flex-col pb-14 text-creme">
        <div className="bg-violet-nuit pt-3">
          {parcours && estCoach ? (
            <Outils className="mx-3.5">
              <Depliant libelle="Changer la couverture">
                <FormAction action={choisirCouverture} bouton="Choisir cette image">
                  <input type="hidden" name="parcours_id" value={parcours.id} />
                  <div className="grid grid-cols-3 gap-2">
                    {BANQUE_COUVERTURES.map((c) => (
                      <label key={c.chemin} className="choix-image">
                        <input type="radio" name="couverture" value={c.chemin} defaultChecked={c.chemin === parcours.couverture_path} aria-label={c.nom} className="sr-only" />
                        <Image src={c.chemin} alt="" width={120} height={72} unoptimized className="h-[72px] w-full object-cover" />
                      </label>
                    ))}
                  </div>
                </FormAction>
                <DepotFichier genre="couverture" cible={parcours.id} accept="image/jpeg,image/png,image/webp" titre="Déposer une image" aide="une photo à toi, en grand format" apres={couvertureDeposee.bind(null, parcours.id)} />
              </Depliant>
              <Depliant libelle="Modifier l’intention">
                <FormAction action={modifierIntention} bouton="Enregistrer">
                  <input type="hidden" name="parcours_id" value={parcours.id} />
                  <textarea name="intention" aria-label="L’intention du parcours" defaultValue={parcours.intention} className="champ-zone min-h-[140px]" />
                </FormAction>
              </Depliant>
              {faites.length ? (
                <Depliant libelle="Modifier le chemin">
                  <FormAction action={enregistrerChemin} bouton="Enregistrer">
                    {faites.map((s) => (
                      <label key={s.id} className="etiquette">
                        séance {s.numero}
                        <input name={`station_${s.id}`} defaultValue={s.station_validee ?? ""} placeholder="le nom de cette station" className="champ" />
                      </label>
                    ))}
                  </FormAction>
                </Depliant>
              ) : null}
              <NoteOutil>les stations se corrigent en place</NoteOutil>
            </Outils>
          ) : null}
          <div className="px-[22px] pb-9 pt-6 md:px-10">
            <ProchaineSeance date={prochaine?.date ?? null} point={point} />
          </div>
        </div>

        <section className="px-[22px] pb-9 pt-10 md:px-10">
          <ZoneMeteo lectureSeule etats={etats} etatInitial={meteo?.etat_code ?? null} noteInitiale={meteo?.note ?? ""} musiques={musiques} traces={traceTextes} />
        </section>

        <div className="mx-auto flex w-full max-w-3xl flex-col">
          {parcours && estCoach ? (
            <Outils className="mx-3.5">
              <form action={creerLettre}>
                <input type="hidden" name="parcours_id" value={parcours.id} />
                <input type="hidden" name="cliente_id" value={id} />
                <button type="submit" className="t-action min-h-[44px] text-[13px] text-rouge">
                  {brouillons.length ? "Reprendre le brouillon" : "Écrire la prochaine lettre"}
                </button>
              </form>
              {enCours ? <NoteOutil>la lettre en cours{envoyeeLe ? `, envoyée le ${envoyeeLe}` : ""}</NoteOutil> : null}
            </Outils>
          ) : null}
          {enCours ? (
            <div className="px-3.5 pt-2.5">
              <ZoneLettre
                titre={titrePropre(enCours.lettre.titre)}
                date={envoyeeLe}
                debut={extrait(lireLettre(enCours.lettre.contenu).preambule || enCours.lettre.intro)}
                exercices={enCours.exercices.map((e, i) => ({ id: e.id, titre: titrePropre(e.titre) || `Exercice ${i + 1}`, ecrit: enCours.ecrits.has(e.id) }))}
                lien={`/coach/clientes/${id}/lettre/${enCours.lettre.id}`}
                actions={
                  !estCoach ? null : <>
                    <Link href={`/coach/clientes/${id}/lettre/${enCours.lettre.id}`} className="text-[13px] text-violet underline">
                      modifier
                    </Link>
                    <Confirmer action={retirerLettre} libelle="retirer" question={`Elle disparaît de l’espace de ${profil.prenom}. Tu confirmes ?`} valeurs={{ id: enCours.lettre.id }} />
                  </>
                }
              />
            </div>
          ) : null}

          <section id="carnet" className="flex scroll-mt-4 flex-col gap-[18px] px-[22px] pb-2.5 pt-11">
            <div className="flex items-end justify-between gap-3">
              <h2 className="t-zone text-creme">son carnet</h2>
              <span className="font-italique text-[13px] italic text-rose">lecture seule</span>
            </div>
            {carnet.length ? (
              <div className="flex flex-col gap-2.5">
                {carnet.map((e, i) => (
                  <EntreeCarnet key={e.id} lectureSeule id={e.id} date={e.date} contenu={e.contenu} aAborder={e.pour_prochaine_seance} origine={origineEntree(e) && { ...origineEntree(e)!, href: `/coach/clientes/${id}/lettre/${e.lettre!.id}` }} decalee={i % 2 === 1} coupee />
                ))}
              </div>
            ) : (
              <p className="t-lecture text-creme/70">Rien pour l’instant.</p>
            )}
          </section>
        </div>

        <section className="mx-auto flex w-full max-w-[1280px] flex-col gap-[18px] pb-2.5 pt-11">
          {parcours && estCoach ? (
            <Outils className="mx-[22px]">
              <Depliant libelle="Partager une ressource" principal>
                <FormAction action={partagerRessource} bouton="Partager" rouge>
                  <input type="hidden" name="parcours_id" value={parcours.id} />
                  <label className="etiquette">
                    dans la bibliothèque
                    <select name="ressource_id" className="champ">
                      {bibliotheque.map((r) => (
                        <option key={r.id} value={r.id}>
                          {titrePropre(r.titre)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="etiquette">
                    ton mot, pourquoi pour elle
                    <textarea name="pourquoi" className="champ-zone min-h-[90px]" />
                  </label>
                </FormAction>
              </Depliant>
              <NoteOutil>choisir dans la bibliothèque, écrire le mot</NoteOutil>
            </Outils>
          ) : null}
          <h2 className="t-zone px-[22px] text-creme md:px-10">pour elle</h2>
          {cartes.length ? (
            <div className="defile md:px-10!">
              {cartes.map(({ a, r, lien, statut }) => (
                <CarteRessource key={a.id} lectureSeule affectationId={a.id} type={r.type} titre={r.titre} auteur={r.auteur} mot={a.pourquoi} image={r.image_url} lien={lien} statut={statut} pied={!estCoach ? null : <span className="pt-2"><Confirmer action={retirerPartage} libelle="retirer" question="Tu confirmes ?" valeurs={{ id: a.id }} /></span>} />
              ))}
            </div>
          ) : null}
        </section>

        <section className="mx-auto flex w-full max-w-3xl flex-col gap-[18px] px-[22px] pt-11">
          {parcours && estCoach ? (
            <Outils>
              <Depliant libelle="Nouvelle séance" principal>
                <FormAction action={creerSeance} bouton="Créer la séance" rouge>
                  <input type="hidden" name="parcours_id" value={parcours.id} />
                  <label className="etiquette">
                    date et heure
                    <input type="datetime-local" name="date" className="champ" />
                  </label>
                </FormAction>
              </Depliant>
              <Depliant libelle="Déposer une note d’Émilien">
                <DepotFichier avecTitre genre="note" cible={id} accept="application/pdf" titre="Choisir le PDF" aide="il apparaîtra dans sa mémoire" apres={noteEmilienDeposee.bind(null, id)} />
              </Depliant>
            </Outils>
          ) : null}
          <h2 className="t-zone text-creme">mémoire</h2>
          {notes.map((n) => (
            <p key={n.id} className="papier flex flex-col gap-1 p-[18px] text-encre">
              <span className="font-italique text-[14px] italic text-violet">Une note d’Émilien pour elle</span>
              <span className="t-carte">{n.titre}</span>
            </p>
          ))}
          <div className="flex flex-col border-b border-[var(--filet-violet)]">{[...seances].map(carteSeance)}</div>
        </section>

        <section className="mx-auto flex w-full max-w-3xl flex-col gap-2 border-t border-[var(--filet-violet)] px-[22px] pt-5" style={{ marginTop: 30 }}>
          <p className="font-italique text-[13px] italic text-rose">Compte</p>
          <p className="text-[13px] text-creme/80">{profil.email}</p>
          <p className="text-[13px] text-creme/80">{parcours?.drive_folder_id ? `Dossier Drive relié : ${parcours.drive_folder_nom ?? parcours.drive_folder_id}` : "Pas encore de dossier Drive relié"}</p>
          {estCoach ? (
            <>
          <EnvoiLienAcces email={profil.email} prenom={profil.prenom} />
          <Outils>
            <Depliant libelle="Modifier la fiche">
              <FormAction action={modifierFiche} bouton="Enregistrer">
                <input type="hidden" name="id" value={id} />
                <label className="etiquette">
                  prénom
                  <input name="prenom" defaultValue={profil.prenom} className="champ" />
                </label>
                <label className="etiquette">
                  nom
                  <input name="nom" defaultValue={profil.nom} className="champ" />
                </label>
                <label className="flex min-h-[44px] items-center gap-2 text-[14px] text-violet">
                  <input type="checkbox" name="actif" defaultChecked={profil.actif} /> elle apparaît dans l’agenda
                </label>
              </FormAction>
            </Depliant>
            {parcours ? (
              <Depliant libelle="Relier le dossier Drive">
                <FormAction action={relierDrive} bouton="Enregistrer">
                  <input type="hidden" name="parcours_id" value={parcours.id} />
                  <label className="etiquette">
                    lien ou identifiant du dossier
                    <input name="drive" defaultValue={parcours.drive_folder_id ?? ""} className="champ" />
                  </label>
                  <label className="etiquette">
                    son nom, pour t’y retrouver
                    <input name="drive_nom" defaultValue={parcours.drive_folder_nom ?? ""} className="champ" />
                  </label>
                </FormAction>
              </Depliant>
            ) : null}
          </Outils>
            </>
          ) : null}
        </section>
      </div>
    </>
  );
}
