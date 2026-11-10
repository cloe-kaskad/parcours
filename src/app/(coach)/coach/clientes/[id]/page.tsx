import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Barre, LigneSeance, PageCoach, Points, TitreSection } from "@/components/coach/base";
import { EnvoiLienAcces } from "@/components/coach/EnvoiLienAcces";
import { Depliant, DepotFichier, FormAction, LecteurAudio } from "@/components/coach/interactifs";
import { MotsStation } from "@/components/coach/MotsStation";
import { NoteParcours, TexteReplie } from "@/components/coach/VueEquipe";
import { TraceChemin } from "@/components/espace/TraceChemin";
import { modifierIntention, noteEmilienDeposee } from "@/lib/actions/clientes";
import { creerLettre } from "@/lib/actions/lettres";
import { partagerRessource } from "@/lib/actions/ressources";
import { audioDepose, creerSeance, enregistrerTranscript, pdfTranscriptDepose } from "@/lib/actions/seances";
import { etatSeance, transcriptPret, type Point } from "@/lib/agenda";
import { exigerEquipe } from "@/lib/auth";
import { urlCouverture } from "@/lib/couvertures";
import { avantOuverture, jourEtHeure, jourEtMois, jourEtMoisCourt, prochaineSeance } from "@/lib/dates";
import { cartesRessources, meteoDuJour } from "@/lib/db/cliente";
import { chargerVueEquipe, type ObjetsSeance } from "@/lib/db/coach";
import type { JournalEntree, Seance } from "@/lib/supabase/types";
import { titrePropre } from "@/lib/textes";

export const metadata = { title: "Vue équipe" };

const SUIVI = { a_voir: "à découvrir", commence: "commencé", termine: "terminé" } as const;

// Les quatre pastilles d'une séance : audio, transcript, retour d'Émilien, lettre.
function Pastilles({ points }: { points: [Point, Point, Point, Point] }) {
  const noms = ["audio", "transcript", "retour d’Émilien", "lettre"];
  const mots: Record<Point, string> = { plein: "là", vide: "pas encore", retard: "en retard" };
  return (
    <span className="flex shrink-0 items-center gap-1.5" role="img" aria-label={points.map((p, i) => `${noms[i]} ${mots[p]}`).join(", ")}>
      {points.map((p, i) => (
        <span key={i} className={`point point-${p}`} />
      ))}
    </span>
  );
}

function Objet({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-[10px] bg-beige/60 p-3">
      <h4 className="font-titre text-[14px] font-semibold text-violet">{titre}</h4>
      {children}
    </div>
  );
}

const Vide = ({ children }: { children: React.ReactNode }) => <p className="text-[12px] text-violet/70">{children}</p>;

function Carnet({ e }: { e: JournalEntree }) {
  return (
    <div className="flex flex-col gap-1 border-t border-[var(--filet-papier)] py-3">
      <span className="font-italique text-[13px] italic text-violet">
        {jourEtMois(e.date)}
        {e.pour_prochaine_seance ? <span className="pl-2 font-sans text-[12px] not-italic text-rouge">à aborder en séance</span> : null}
      </span>
      <p className="line-clamp-4 whitespace-pre-line text-[14px] leading-[1.55]">{e.contenu}</p>
    </div>
  );
}

export default async function VueEquipe({ params }: PageProps<"/coach/clientes/[id]">) {
  const moi = await exigerEquipe();
  const estCoach = moi.role === "coach";
  const { id } = await params;
  const d = await chargerVueEquipe(id, moi);
  if (!d) notFound();
  const { profil, parcours, seances, objets, envoyees, note, notes, carnet, bibliotheque } = d;
  const [{ etats, meteo, traces }, cartes] = await Promise.all([meteoDuJour(id), parcours ? cartesRessources(parcours.id, id) : Promise.resolve([])]);

  const parNumero = [...seances].reverse();
  const faites = parNumero.filter((s) => s.statut === "faite");
  const derniere = faites.at(-1);
  const prochaine = prochaineSeance(parNumero);
  const point = derniere && prochaine ? `entre la séance ${derniere.numero} et la séance ${prochaine.numero}` : derniere ? `après la séance ${derniere.numero}` : null;
  const nomDe = (code: string) => etats.find((e) => e.code === code)?.libelle ?? "";
  const lienSeance = (s: Seance) => (estCoach ? `/coach/clientes/${id}/seances/${s.id}` : `/emilien/seances/${s.id}`);
  const voirCommeElle = `/coach/clientes/${id}/espace`;

  // Il reste à faire : les séances vécues depuis l'ouverture où quelque chose manque.
  const aFaire = seances.filter((s) => s.statut === "faite" && s.date && !avantOuverture(s.date)).map((s) => ({ s, etat: etatSeance(s, envoyees.has(s.id)) })).filter(({ etat }) => !(etat.transcript && etat.emilien && etat.exercices));

  const pastilles = (s: Seance, o: ObjetsSeance): [Point, Point, Point, Point] => {
    const e = etatSeance(s, Boolean(o.lettre));
    return [s.audio_path ? "plein" : "vide", e.points[0], o.retours.length ? "plein" : "vide", e.points[2]];
  };
  const derniereMeteo = meteo ?? traces[0] ?? null;

  return (
    <PageCoach>
      <Barre retour={estCoach ? { href: "/coach", libelle: "Agenda" } : { href: "/emilien", libelle: "À lire" }} />

      {/* 1. Le bandeau */}
      <div className="relative h-[160px] overflow-hidden bg-violet-nuit md:h-[220px]">
        <Image src={urlCouverture(parcours?.couverture_path ?? null)} alt="" fill unoptimized priority className="object-cover opacity-80 md:object-[50%_40%]" />
        <div className="absolute inset-x-0 bottom-0 h-[110px] bg-gradient-to-b from-violet-nuit/0 to-violet-nuit" />
        <h1 className="absolute bottom-4 left-[22px] font-titre text-[52px] font-semibold leading-[0.9] tracking-[-0.03em] text-creme md:bottom-6 md:left-10 md:text-[84px]">{profil.prenom}</h1>
      </div>
      <div className="bg-violet-nuit px-[22px] pb-5 pt-3 text-creme md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            {point ? <p className="font-italique text-[15px] italic text-rose">{point}</p> : null}
            <p className="text-[14px] text-creme/85">{prochaine?.date ? `Prochaine séance : ${jourEtHeure(prochaine.date)}` : prochaine ? `Séance ${prochaine.numero} à dater` : "Pas de prochaine séance prévue"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href={voirCommeElle} className="t-action inline-flex min-h-[44px] items-center text-[15px] text-rose">
              Voir comme elle →
            </Link>
            {estCoach && prochaine ? (
              <Link href={`/coach/clientes/${id}/seances/${prochaine.id}/avant`} className="t-action inline-flex min-h-[44px] items-center text-[15px] text-creme">
                Avant la séance
              </Link>
            ) : null}
            {estCoach && parcours ? (
              <div className="t-action flex flex-wrap items-center text-[15px] text-creme [&>button]:min-h-[44px]">
                <Depliant libelle="Nouvelle séance">
                  <div className="papier rounded-[10px] p-3">
                    <FormAction action={creerSeance} bouton="Créer la séance" rouge>
                      <input type="hidden" name="parcours_id" value={parcours.id} />
                      <label className="etiquette">
                        date et heure
                        <input type="datetime-local" name="date" className="champ" />
                      </label>
                    </FormAction>
                  </div>
                </Depliant>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col px-[22px] pb-16 md:px-10">
        {/* 2. Il reste à faire */}
        <section className="flex flex-col pt-8">
          <TitreSection className={`pb-2.5 ${aFaire.some((a) => a.etat.retard) ? "text-rouge" : "text-violet"}`}>Il reste à faire</TitreSection>
          {aFaire.length ? (
            aFaire.map(({ s, etat }) => <LigneSeance key={s.id} href={lienSeance(s)} date={s.date} retardee={etat.retard} prenom={profil.prenom} numero={s.numero} libelle={etat.libelle} droite={<Points points={etat.points} />} />)
          ) : (
            <p className="border-t border-[var(--filet-papier)] py-3 text-[14px] text-violet/80">Rien en attente pour elle.</p>
          )}
        </section>

        {/* 3. Où elle en est */}
        <section className="flex flex-col gap-4 pt-10">
          <TitreSection className="text-violet">Où elle en est</TitreSection>
          {parcours ? (
            <div className="flex flex-col gap-1">
              <p className="font-titre text-[13px] font-semibold text-violet/80">Note de parcours</p>
              <NoteParcours parcoursId={parcours.id} texte={note?.note_equipe ?? ""} signature={note?.note_equipe.trim() ? `${note.auteur ?? "l’équipe"}, le ${jourEtMois(note.note_equipe_modifiee_at)}` : null} />
            </div>
          ) : null}
          <div className="flex flex-col gap-1 border-t border-[var(--filet-papier)] pt-4">
            <p className="font-titre text-[13px] font-semibold text-violet/80">Son intention</p>
            {parcours?.intention.trim() ? <p className="font-italique text-[16px] italic leading-[1.5] text-violet">{parcours.intention}</p> : <Vide>Pas encore d’intention écrite.</Vide>}
            {estCoach && parcours ? (
              <div className="outils-nus">
                <Depliant libelle="Modifier l’intention">
                  <FormAction action={modifierIntention} bouton="Enregistrer">
                    <input type="hidden" name="parcours_id" value={parcours.id} />
                    <textarea name="intention" aria-label="L’intention du parcours" defaultValue={parcours.intention} className="champ-zone min-h-[120px]" />
                  </FormAction>
                </Depliant>
              </div>
            ) : null}
          </div>
          <div className="-mx-[22px] md:mx-0 md:overflow-hidden md:rounded-[12px]">
            <TraceChemin stations={faites.map((s) => ({ id: s.id, nom: s.station_validee ?? s.mots_cles[0] ?? null }))} graine={parcours?.id ?? id} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-titre text-[13px] font-semibold text-violet/80">Sa météo</p>
            {derniereMeteo ? (
              <p className="text-[14px]">
                <span className="font-titre font-semibold text-violet">{nomDe(derniereMeteo.etat_code)}</span>
                <span className="text-violet/75"> · {meteo ? "aujourd’hui" : jourEtMois(derniereMeteo.date)}</span>
                {derniereMeteo.note ? <span className="block pt-1 font-italique italic text-violet">« {derniereMeteo.note} »</span> : null}
              </p>
            ) : (
              <Vide>Pas encore de météo.</Vide>
            )}
            {traces.length > (meteo ? 0 : 1) ? <p className="text-[12px] text-violet/70">{traces.slice(meteo ? 0 : 1).map((t) => `${nomDe(t.etat_code)} · ${jourEtMoisCourt(t.date)}`).join("   ")}</p> : null}
          </div>
        </section>

        {/* 4. Les séances */}
        <section className="flex flex-col pt-10">
          <div className="flex items-baseline justify-between gap-3 pb-2.5">
            <TitreSection className="text-violet">Les séances</TitreSection>
            <span className="text-[11px] text-violet/70">audio · transcript · Émilien · lettre</span>
          </div>
          {seances.length ? null : <Vide>Aucune séance pour l’instant.</Vide>}
          {seances.map((s) => {
            const o = objets.get(s.id)!;
            const sansMots = s.statut === "faite" && !s.mots_cles.length && !s.station_validee;
            const proposition = s.statut === "faite" && !s.mots_cles.length && (s.mots_proposes.length > 0 || Boolean(s.station_proposee));
            const texte = transcriptPret(s);
            return (
              <details key={s.id} open={s.id === (derniere ?? seances[0])?.id} className="group border-t border-[var(--filet-papier)]">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 py-3">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-titre text-[18px] font-semibold leading-none text-violet">
                      Séance {s.numero}
                      <span className="pl-2 font-italique text-[13px] font-normal italic text-violet/80">{s.date ? jourEtMois(s.date) : "sans date"}</span>
                    </span>
                    {s.mots_cles.length || s.station_validee ? (
                      <span className="truncate text-[12px] text-violet/85">
                        {s.mots_cles.join(" · ")}
                        {s.station_validee ? <span className="font-semibold"> {s.mots_cles.length ? "· " : ""}{s.station_validee}</span> : null}
                      </span>
                    ) : sansMots ? (
                      <span className="text-[12px] font-medium text-rouge">mots à poser</span>
                    ) : s.statut !== "faite" ? (
                      <span className="text-[12px] text-violet/70">à venir</span>
                    ) : null}
                  </span>
                  <Pastilles points={pastilles(s, o)} />
                  <span aria-hidden="true" className="text-[12px] text-violet/60 transition-transform group-open:rotate-90">›</span>
                </summary>

                <div className="flex flex-col gap-3 pb-5">
                  <div className={`grid grid-cols-2 gap-2.5 ${estCoach ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
                    <Objet titre="Audio">
                      {o.audio ? <LecteurAudio src={o.audio} dureeConnue={s.audio_duree_sec} /> : estCoach ? <DepotFichier genre="audio" cible={s.id} accept="audio/*,.m4a,.mp3,.wav" titre="Déposer" aide="l’audio de la séance" apres={audioDepose.bind(null, s.id)} /> : <Vide>pas d’audio</Vide>}
                    </Objet>

                    <Objet titre="Transcript">
                      {o.enCours ? (
                        <Vide>en cours, reviens dans quelques minutes</Vide>
                      ) : texte ? (
                        <div className="flex flex-col gap-1">
                          {s.transcript_formate || s.transcript_segments?.length ? (
                            <Link href={lienSeance(s)} className="t-action text-[14px] text-violet">
                              Lire →
                            </Link>
                          ) : null}
                          {o.pdf ? (
                            <a href={o.pdf} target="_blank" rel="noreferrer" className="t-action text-[14px] text-violet">
                              PDF →
                            </a>
                          ) : null}
                        </div>
                      ) : estCoach ? (
                        <div className="flex flex-col gap-2">
                          <DepotFichier genre="pdf" cible={s.id} accept="application/pdf" titre="Déposer un PDF" aide="le transcript" apres={pdfTranscriptDepose.bind(null, s.id)} />
                          <div className="outils-nus">
                            <Depliant libelle="ou coller le texte">
                              <FormAction action={enregistrerTranscript} bouton="Enregistrer">
                                <input type="hidden" name="id" value={s.id} />
                                <textarea name="transcript" aria-label={`Le transcript de la séance ${s.numero}`} className="champ-zone min-h-[160px]" />
                              </FormAction>
                            </Depliant>
                          </div>
                        </div>
                      ) : (
                        <Vide>pas encore</Vide>
                      )}
                    </Objet>

                    <Objet titre="Retour d’Émilien">
                      {o.retours.length ? (
                        o.retours.map((r) => (
                          <div key={r.id} className="flex flex-col gap-1">
                            {r.envoye_at ? <span className="font-italique text-[12px] italic text-violet/80">{jourEtMois(r.envoye_at)}</span> : null}
                            {r.contenu.trim() ? <TexteReplie texte={r.contenu} className="font-italique italic text-violet" /> : null}
                            {r.pdf ? (
                              <a href={r.pdf} target="_blank" rel="noreferrer" className="t-action text-[13px] text-violet">
                                PDF →
                              </a>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <Vide>pas encore de retour</Vide>
                      )}
                      {!estCoach && !o.retours.some((r) => r.auteur_id === moi.id) ? (
                        <Link href={`/emilien/seances/${s.id}`} className="t-action text-[14px] text-rouge">
                          {o.monRetour ? "Reprendre mon retour →" : "Écrire mon retour →"}
                        </Link>
                      ) : null}
                    </Objet>

                    {estCoach ? (
                      <Objet titre="Ma préparation">
                        {o.preparation?.contenu.trim() ? <TexteReplie texte={o.preparation.contenu} /> : null}
                        {o.preparation?.pdf ? (
                          <a href={o.preparation.pdf} target="_blank" rel="noreferrer" className="t-action text-[13px] text-violet">
                            PDF →
                          </a>
                        ) : null}
                        {!o.preparation ? <Vide>rien d’écrit</Vide> : null}
                        <Link href={`/coach/clientes/${id}/seances/${s.id}/avant`} className="t-action text-[13px] text-violet">
                          Avant la séance →
                        </Link>
                      </Objet>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px]">
                    {o.lettre ? (
                      <Link href={estCoach ? `/coach/clientes/${id}/lettre/${o.lettre.id}` : `/coach/clientes/${id}/espace`} className="text-violet">
                        <span className="font-titre font-semibold">Lettre</span> « {titrePropre(o.lettre.titre)} »{o.lettre.publiee_at && !avantOuverture(o.lettre.publiee_at) ? `, ${jourEtMois(o.lettre.publiee_at)}` : ""} <span className="t-action">· Ouvrir →</span>
                      </Link>
                    ) : estCoach && parcours && s.statut === "faite" ? (
                      <form action={creerLettre}>
                        <input type="hidden" name="parcours_id" value={parcours.id} />
                        <input type="hidden" name="cliente_id" value={id} />
                        <input type="hidden" name="seance_id" value={s.id} />
                        <button type="submit" className="t-action min-h-[44px] text-[14px] text-rouge">
                          {o.brouillon ? "Reprendre la lettre" : "Écrire la lettre"}
                        </button>
                      </form>
                    ) : s.statut === "faite" ? (
                      <Vide>pas de lettre</Vide>
                    ) : null}
                    <Link href={lienSeance(s)} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-violet">
                      Ouvrir la séance →
                    </Link>
                  </div>

                  {estCoach && (sansMots || proposition) ? <MotsStation id={s.id} valides={s.mots_cles} station={s.station_validee} proposes={s.mots_proposes} stationProposee={s.station_proposee} prenom={profil.prenom} /> : null}
                </div>
              </details>
            );
          })}
        </section>

        {/* 5. Notes d'Émilien */}
        <section className="flex flex-col gap-2 pt-10">
          <TitreSection className="text-violet">Notes d’Émilien</TitreSection>
          {notes.length ? (
            notes.map((n) => (
              <div key={n.id} className="flex items-baseline justify-between gap-3 border-t border-[var(--filet-papier)] py-3">
                <span className="min-w-0">
                  <span className="t-carte block truncate">{n.titre}</span>
                  <span className="font-italique text-[12px] italic text-violet/80">{jourEtMois(n.deposee_at)}</span>
                </span>
                {n.lien ? (
                  <a href={n.lien} target="_blank" rel="noreferrer" className="t-action shrink-0 text-[14px] text-violet">
                    Ouvrir →
                  </a>
                ) : null}
              </div>
            ))
          ) : (
            <Vide>Aucune note déposée.</Vide>
          )}
          {estCoach ? (
            <div className="outils-nus">
              <Depliant libelle="Déposer une note">
                <DepotFichier avecTitre genre="note" cible={id} accept="application/pdf" titre="Choisir le PDF" aide="elle apparaîtra dans sa mémoire" apres={noteEmilienDeposee.bind(null, id)} />
              </Depliant>
            </div>
          ) : null}
        </section>

        {/* 6. Son carnet */}
        <section className="flex flex-col pt-10">
          <div className="flex items-baseline justify-between gap-3 pb-1">
            <TitreSection className="text-violet">Son carnet</TitreSection>
            <span className="font-italique text-[12px] italic text-violet/75">lecture seule</span>
          </div>
          {carnet.aborder.map((e) => (
            <Carnet key={e.id} e={e} />
          ))}
          {carnet.recents.map((e) => (
            <Carnet key={e.id} e={e} />
          ))}
          {!carnet.aborder.length && !carnet.recents.length ? <Vide>Rien pour l’instant.</Vide> : null}
          <Link href={`${voirCommeElle}#carnet`} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-violet">
            Tout son carnet →
          </Link>
        </section>

        {/* 7. Ses ressources */}
        <section className="flex flex-col pt-10">
          <TitreSection className="pb-1 text-violet">Ses ressources</TitreSection>
          {cartes.length ? (
            cartes.map(({ a, r, statut }) => (
              <div key={a.id} className="flex items-baseline justify-between gap-3 border-t border-[var(--filet-papier)] py-3">
                <span className="min-w-0">
                  <span className="t-carte block">{titrePropre(r.titre)}</span>
                  {r.auteur ? <span className="text-[12px] text-violet/75">{r.auteur}</span> : null}
                </span>
                <span className={`shrink-0 text-[12px] ${statut === "termine" ? "font-semibold text-violet" : "text-violet/75"}`}>{SUIVI[statut]}</span>
              </div>
            ))
          ) : (
            <Vide>Rien de partagé pour l’instant.</Vide>
          )}
          {estCoach && parcours ? (
            <div className="outils-nus">
              <Depliant libelle="Partager une ressource">
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
            </div>
          ) : null}
        </section>

        {/* 8. Compte */}
        <section className="mt-10 flex flex-col gap-2 border-t border-[var(--filet-papier-fort)] pt-5">
          <p className="font-italique text-[13px] italic text-violet">Compte</p>
          <p className="text-[13px]">{profil.email}</p>
          <p className="text-[13px] text-violet/80">{parcours?.drive_folder_id ? `Dossier Drive relié : ${parcours.drive_folder_nom ?? parcours.drive_folder_id}` : "Pas encore de dossier Drive relié"}</p>
          {estCoach ? <EnvoiLienAcces surPapier email={profil.email} prenom={profil.prenom} /> : null}
          <Link href={voirCommeElle} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-rouge">
            Voir comme elle →
          </Link>
          {estCoach ? <p className="text-[12px] text-violet/70">Couverture, nom et dossier Drive se modifient depuis « Voir comme elle ».</p> : null}
        </section>
      </div>
    </PageCoach>
  );
}
