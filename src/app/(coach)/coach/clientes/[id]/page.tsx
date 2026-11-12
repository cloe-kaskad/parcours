import Image from "next/image";
import Link from "next/link";
import { ACCEPT_AUDIO } from "@/lib/depot";
import { notFound } from "next/navigation";
import { Barre, PageCoach } from "@/components/coach/base";
import { EnvoiLienAcces } from "@/components/coach/EnvoiLienAcces";
import { Depliant, DepotFichier, FormAction, LecteurAudio } from "@/components/coach/interactifs";
import { Lisible } from "@/components/coach/Lisible";
import { TexteLecture } from "@/components/coach/TexteLecture";
import { NoteParcours, ProposerMots } from "@/components/coach/VueEquipe";
import { VoixCliente } from "@/components/coach/VoixCliente";
import { retourLisible } from "@/lib/retour";
import { Calendrier } from "@/components/espace/Calendrier";
import { TraceChemin } from "@/components/espace/TraceChemin";
import { debutDuParcours } from "@/lib/chemin";
import { modifierDateDebut, modifierIntention, noteEmilienDeposee } from "@/lib/actions/clientes";
import { creerLettre } from "@/lib/actions/lettres";
import { partagerRessource } from "@/lib/actions/ressources";
import { audioDepose, creerSeance, enregistrerChemin, enregistrerDate, enregistrerTranscript, pdfTranscriptDepose, validerMots } from "@/lib/actions/seances";
import { etatSeance, transcriptPret, type Point } from "@/lib/agenda";
import { exigerEquipe } from "@/lib/auth";
import { urlCouverture } from "@/lib/couvertures";
import { avantOuverture, jourEtHeure, jourEtMois, jourEtMoisCourt, moisAnnee, prochaineSeance } from "@/lib/dates";
import { cartesRessources, meteoDuJour } from "@/lib/db/cliente";
import { chargerVueEquipe, type ObjetsSeance } from "@/lib/db/coach";
import type { JournalEntree, Seance } from "@/lib/supabase/types";
import { titrePropre } from "@/lib/textes";

export const metadata = { title: "Vue équipe" };

const SUIVI = [
  ["a_voir", "à découvrir"],
  ["commence", "commencé"],
  ["termine", "terminé"],
] as const;

// Les points d'une séance, dans l'ordre de la légende.
function Points({ points, noms }: { points: Point[]; noms: string[] }) {
  const mots: Record<Point, string> = {
    plein: "fait",
    vide: "pas encore",
    retard: "en retard",
  };
  return (
    <span className="flex shrink-0 items-center gap-1.5" role="img" aria-label={points.map((p, i) => `${noms[i]} ${mots[p]}`).join(", ")}>
      {points.map((p, i) => (
        <span key={i} className={`point point-${p}`} />
      ))}
    </span>
  );
}

function Titre({ children, droite }: { children: React.ReactNode; droite?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-titre text-[26px] font-semibold leading-none tracking-[-0.02em] text-violet">{children}</h2>
      {droite}
    </div>
  );
}

const Statut = ({ children }: { children: React.ReactNode }) => <span className="text-[11px] text-violet/80">{children}</span>;

function Carnet({ e, prenom }: { e: JournalEntree; prenom: string }) {
  return <VoixCliente prenom={prenom} date={avantOuverture(e.date) ? null : jourEtMois(e.date)} texte={e.contenu} aAborder={e.pour_prochaine_seance} compact />;
}

const dureeAudio = (sec: number | null) => {
  if (!sec) return null;
  const min = Math.round(sec / 60);
  return min >= 60 ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}` : `${min} min`;
};
const dateReelle = (d: string | null | undefined) => (d && !avantOuverture(d) ? jourEtMoisCourt(d) : null);

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

  // Il reste à faire : les séances vécues depuis l'ouverture où quelque chose manque ;
  // à défaut, l'état de la dernière séance.
  const datees = seances.filter((s) => s.statut === "faite" && s.date && !avantOuverture(s.date)).map((s) => ({ s, etat: etatSeance(s, envoyees.has(s.id)) }));
  const enAttente = datees.filter(({ etat }) => !(etat.transcript && etat.emilien && etat.exercices));
  const lignesAFaire = enAttente.length ? enAttente : datees.slice(0, 1);
  const sansMots = faites.filter((s) => !s.mots_cles.length && !s.station_validee).length;

  const pastilles = (s: Seance, o: ObjetsSeance): Point[] => {
    const e = etatSeance(s, Boolean(o.lettre));
    return [s.audio_path ? "plein" : "vide", e.points[0], o.retours.length ? "plein" : "vide", e.points[2]];
  };
  const derniereMeteo = meteo ?? traces[0] ?? null;
  const autresTraces = traces.slice(meteo ? 0 : 1);

  return (
    <PageCoach>
      <Barre retour={estCoach ? { href: "/coach/clientes", libelle: "Clientes" } : { href: "/emilien", libelle: "À lire" }} />

      {/* 1. Le bandeau */}
      <div className="bg-violet text-creme">
        <div className="relative h-[160px] overflow-hidden bg-violet-nuit md:h-[220px]">
          <Image src={urlCouverture(parcours?.couverture_path ?? null)} alt="" fill unoptimized priority className="object-cover object-[50%_60%]" />
          <div className="absolute inset-x-0 bottom-0 h-[100px] bg-gradient-to-b from-violet/0 to-violet" />
          <div className="absolute inset-x-[22px] bottom-2.5 flex items-end justify-between gap-3 md:inset-x-10 md:bottom-3.5">
            <h1 className="font-titre text-[48px] font-semibold leading-[0.9] tracking-[-0.03em] text-creme md:text-[80px]">{profil.prenom}</h1>
            {estCoach ? (
              <Link href={voirCommeElle} className="pb-1.5 text-[11px] text-rose underline md:text-[12px]">
                changer la couverture
              </Link>
            ) : null}
          </div>
        </div>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3.5 px-[22px] pb-[22px] pt-3.5 md:flex-row md:items-center md:justify-between md:gap-6 md:px-10 md:pb-[26px] md:pt-[18px]">
          <div className="flex items-center gap-3.5">
            {prochaine?.date ? <Calendrier date={prochaine.date} /> : null}
            <div className="flex flex-col gap-[3px]">
              {point ? <span className="font-italique text-[13px] italic text-rose">{point}</span> : null}
              <span className="font-titre text-[18px] font-semibold leading-none">{prochaine?.date ? jourEtHeure(prochaine.date) : prochaine ? `séance ${prochaine.numero} à dater` : "pas de prochaine séance"}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <Link href={voirCommeElle} className="pilule">
              Voir comme elle
            </Link>
            {estCoach && parcours ? (
              <div className="contents">
                <Depliant classeBouton="pilule pilule-rouge" libelle="Nouvelle séance">
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
            {estCoach && prochaine ? (
              <Link href={`/coach/clientes/${id}/seances/${prochaine.id}/avant`} className="pilule">
                Avant la séance
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col px-[22px] pb-16 md:px-10">
        {/* 2. Il reste à faire */}
        <section className="flex flex-col gap-3 pt-7 md:pt-8">
          <Titre>Il reste à faire</Titre>
          <div className="flex flex-col border-b border-[var(--filet-papier)]">
            {lignesAFaire.length ? (
              lignesAFaire.map(({ s, etat }) => {
                const lettre = objets.get(s.id)?.lettre;
                const fait = etat.transcript && etat.emilien && etat.exercices;
                return (
                  <Link key={s.id} href={lienSeance(s)} className="flex items-center gap-3.5 border-t border-[var(--filet-papier)] py-3">
                    <Points points={etat.points} noms={["transcript", estCoach ? "Émilien" : "ton retour", "lettre"]} />
                    <span className={`flex-1 text-[15px] leading-[1.55] ${etat.retard ? "text-rouge" : ""}`}>
                      Séance {s.numero} : {fait ? "tout est fait." : `${etat.libelle}.`}
                      {fait && dateReelle(lettre?.publiee_at) ? <span className="font-italique italic text-violet"> Lettre envoyée le {dateReelle(lettre?.publiee_at)}.</span> : null}
                    </span>
                  </Link>
                );
              })
            ) : (
              <p className="m-0 border-t border-[var(--filet-papier)] py-3 text-[15px]">Rien en attente pour elle.</p>
            )}
            {estCoach && sansMots ? (
              <div className="flex items-center gap-3.5 border-t border-[var(--filet-papier)] py-3">
                <span className="w-[46px] shrink-0 font-titre text-[13px] font-semibold text-rouge">{sansMots}</span>
                <span className="flex-1 text-[15px] leading-[1.55]">
                  {sansMots > 1 ? "séances passées sans mots ni station." : "séance passée sans mots ni station."}{" "}
                  <a href="#seances" className="font-titre font-semibold text-rouge">
                    Les poser ↓
                  </a>
                </span>
              </div>
            ) : null}
          </div>
          <p className="m-0 text-[11px] text-violet/70">{estCoach ? "transcript · Émilien · lettre. Un point rouge quand c’est en retard (transcript à J+1, lettre à J+7)." : "transcript · ton retour · lettre."}</p>
        </section>

        {/* 3. Où elle en est */}
        <section className="flex flex-col gap-3 pt-[34px]">
          <Titre>Où elle en est</Titre>
          <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:gap-x-10">
            <div className="flex flex-col gap-3">
              {parcours ? <NoteParcours parcoursId={parcours.id} texte={note?.note_equipe ?? ""} signature={note?.note_equipe.trim() ? `modifiée par ${note.auteur ?? "l’équipe"} · ${jourEtMoisCourt(note.note_equipe_modifiee_at)}` : null} /> : null}
              <div className="flex flex-col">
                <p className="m-0 font-italique text-[14px] italic leading-[1.55] text-violet">Intention : {parcours?.intention.trim() || "pas encore écrite."}</p>
                {estCoach && parcours ? (
                  <div className="flex flex-wrap items-center">
                    <Depliant classeBouton="outil text-[12px]" libelle="modifier">
                      <FormAction action={modifierIntention} bouton="Enregistrer">
                        <input type="hidden" name="parcours_id" value={parcours.id} />
                        <textarea name="intention" aria-label="L’intention du parcours" defaultValue={parcours.intention} className="champ-zone min-h-[120px]" />
                      </FormAction>
                    </Depliant>
                    <span aria-hidden="true" className="px-2 text-[12px] text-violet/50">·</span>
                    <Depliant classeBouton="outil text-[12px]" libelle={parcours.date_debut ? `début : ${moisAnnee(parcours.date_debut)}` : "date de début"}>
                      <FormAction action={modifierDateDebut} bouton="Enregistrer" className="flex-row items-end">
                        <input type="hidden" name="parcours_id" value={parcours.id} />
                        <label className="etiquette min-w-0 flex-1">
                          début du parcours, borne de départ du chemin
                          <input type="date" name="date_debut" defaultValue={parcours.date_debut ?? ""} className="champ" />
                        </label>
                      </FormAction>
                    </Depliant>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-[6px]">
                <TraceChemin compact debut={debutDuParcours(parcours?.date_debut, seances)} stations={faites.map((s) => ({ id: s.id, nom: s.station_validee ?? s.mots_cles[0] ?? null }))} graine={parcours?.id ?? id} />
              </div>
              {estCoach && faites.length ? (
                <div className="flex flex-wrap items-center -mt-2">
                  <Depliant classeBouton="outil text-[12px]" libelle="modifier le chemin">
                    <FormAction action={enregistrerChemin} bouton="Enregistrer">
                      {faites.map((s) => (
                        <label key={s.id} className="etiquette">
                          séance {s.numero}
                          <input name={`station_${s.id}`} defaultValue={s.station_validee ?? ""} placeholder="le nom de cette station" className="champ" />
                        </label>
                      ))}
                    </FormAction>
                  </Depliant>
                </div>
              ) : null}
              <div className="flex flex-col gap-1">
                <p className="m-0 text-[13px]">
                  Dernière météo :{" "}
                  {derniereMeteo ? (
                    <>
                      <span className="font-titre font-semibold text-violet">{nomDe(derniereMeteo.etat_code)}</span> <span className="font-italique italic text-violet">· {meteo ? "aujourd’hui" : jourEtMois(derniereMeteo.date)}</span>
                    </>
                  ) : (
                    <span className="text-violet/70">pas encore</span>
                  )}
                </p>
                {derniereMeteo?.note ? <p className="m-0 font-italique text-[13px] italic text-violet">« {derniereMeteo.note} »</p> : null}
                {autresTraces.length ? <p className="m-0 text-[11px] text-violet/70">{autresTraces.map((t) => `${nomDe(t.etat_code)} · ${jourEtMoisCourt(t.date)}`).join("   ")}</p> : null}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Les séances */}
        <section id="seances" className="flex scroll-mt-4 flex-col gap-3 pt-[34px]">
          <Titre droite={<span className="text-[11px] text-violet/80">audio · transcript · Émilien · lettre</span>}>Les séances</Titre>
          <div className="flex flex-col border-b border-[var(--filet-papier)]">
            {seances.length ? null : <p className="m-0 border-t border-[var(--filet-papier)] py-3 text-[14px] text-violet/75">Aucune séance pour l’instant.</p>}
            {seances.map((s) => {
              const o = objets.get(s.id)!;
              const faite = s.statut === "faite";
              const aPoser = faite && !s.mots_cles.length && !s.station_validee;
              const proposition = aPoser && (s.mots_proposes.length > 0 || Boolean(s.station_proposee));
              const sansMonRetour = !estCoach && faite && !o.retours.some((r) => r.auteur_id === moi.id);

              if (!faite) {
                return (
                  <div key={s.id} className="flex items-center gap-3 border-t border-[var(--filet-papier)] py-3.5 opacity-80">
                    <span className="flex-1 font-titre text-[18px] font-semibold leading-none">
                      Séance {s.numero} <span className="font-normal opacity-60">· {s.date ? jourEtMoisCourt(s.date) : "sans date"} · à venir</span>
                    </span>
                    {estCoach ? (
                      <Link href={`/coach/clientes/${id}/seances/${s.id}/avant`} className="font-titre text-[13px] font-semibold text-rouge">
                        Avant la séance →
                      </Link>
                    ) : null}
                  </div>
                );
              }

              return (
                <details key={s.id} open={s.id === derniere?.id} className="group border-t border-[var(--filet-papier)]">
                  <summary className="flex cursor-pointer list-none items-center gap-3 py-3.5 [&::-webkit-details-marker]:hidden">
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-titre text-[18px] font-semibold leading-none text-encre">
                        Séance {s.numero} {s.date ? <span className="font-normal opacity-60">· {jourEtMois(s.date)}</span> : <span className="font-italique text-[14px] font-normal italic text-violet">sans date</span>}
                      </span>
                      {s.mots_cles.length ? <span className="font-titre text-[13px] font-medium text-rouge">{s.mots_cles.join(" · ")}</span> : null}
                      {s.station_validee ? <span className="font-italique text-[12px] italic text-violet">station : {s.station_validee}</span> : null}
                      {aPoser ? <span className={`text-[12px] font-medium ${estCoach ? "text-rouge" : "text-violet/70"}`}>{estCoach ? (proposition ? "mots proposés, à valider" : "mots à poser") : "mots à poser par Cloé"}</span> : null}
                    </span>
                    <Points points={pastilles(s, o)} noms={["audio", "transcript", "retour d’Émilien", "lettre"]} />
                    {sansMonRetour ? (
                      <Link href={`/emilien/seances/${s.id}`} className="font-titre text-[12px] font-semibold text-rouge">
                        Écrire mon retour →
                      </Link>
                    ) : (
                      <span className="w-[42px] text-right font-titre text-[12px] font-semibold text-violet">
                        <span className="group-open:hidden">déplier</span>
                        <span className="hidden group-open:inline">replier</span>
                      </span>
                    )}
                  </summary>

                  <div className="flex flex-col gap-3 pb-[18px]">
                    {estCoach && !s.date ? (
                      <div className="flex flex-wrap items-center -mt-2">
                        <Depliant classeBouton="outil text-[11px]" libelle="dater">
                          <FormAction action={enregistrerDate} bouton="Enregistrer" className="flex-row items-end">
                            <input type="hidden" name="id" value={s.id} />
                            <input type="datetime-local" name="date" aria-label={`Date de la séance ${s.numero}`} className="champ min-w-0 flex-1" />
                          </FormAction>
                        </Depliant>
                      </div>
                    ) : null}

                    <div className={`grid grid-cols-2 gap-2.5 md:gap-3 ${estCoach ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
                      <div className="objet">
                        <h3 className="font-titre text-[14px] font-semibold text-violet">Audio</h3>
                        {o.audio ? (
                          <>
                            <LecteurAudio src={o.audio} dureeConnue={s.audio_duree_sec} />
                            <Statut>{[dureeAudio(s.audio_duree_sec), s.audio_source === "drive" ? "reçu du Drive" : "déposé"].filter(Boolean).join(" · ")}</Statut>
                          </>
                        ) : estCoach ? (
                          <DepotFichier genre="audio" cible={s.id} accept={ACCEPT_AUDIO} titre="Déposer" aide="l’audio, si tu l’as" apres={audioDepose.bind(null, s.id)} />
                        ) : (
                          <Statut>pas d’audio</Statut>
                        )}
                      </div>

                      <div className="objet">
                        <h3 className="font-titre text-[14px] font-semibold text-violet">Transcript</h3>
                        {o.enCours ? (
                          <Statut>en cours, reviens dans quelques minutes</Statut>
                        ) : transcriptPret(s) ? (
                          <>
                            <Statut>{s.transcript_segments?.length ? "prêt · deux voix" : "prêt"}</Statut>
                            <div className="flex flex-wrap gap-x-2.5">
                              {s.transcript_formate || s.transcript_segments?.length ? (
                                <Link href={lienSeance(s)} className="outil outil-rouge">
                                  {estCoach ? "Lire" : "Lire et écouter"}
                                </Link>
                              ) : null}
                              {estCoach ? (
                                <Link href={lienSeance(s)} className="outil text-[12px]">
                                  corriger
                                </Link>
                              ) : null}
                              {o.pdf ? (
                                <a href={o.pdf} target="_blank" rel="noreferrer" className="outil text-[12px]">
                                  PDF
                                </a>
                              ) : null}
                            </div>
                          </>
                        ) : estCoach ? (
                          <>
                            <DepotFichier genre="pdf" cible={s.id} accept="application/pdf" titre="Déposer un PDF" aide="le transcript" apres={pdfTranscriptDepose.bind(null, s.id)} />
                            <div className="flex flex-wrap items-center">
                              <Depliant classeBouton="outil text-[12px]" libelle="ou coller le texte">
                                <FormAction action={enregistrerTranscript} bouton="Enregistrer">
                                  <input type="hidden" name="id" value={s.id} />
                                  <textarea name="transcript" aria-label={`Le transcript de la séance ${s.numero}`} className="champ-zone min-h-[160px]" />
                                </FormAction>
                              </Depliant>
                            </div>
                          </>
                        ) : (
                          <Statut>pas encore</Statut>
                        )}
                      </div>

                      <div className="objet col-span-2 md:col-span-full">
                        <h3 className="font-titre text-[14px] font-semibold text-violet">Retour d’Émilien</h3>
                        {o.retours.length ? (
                          o.retours.map((r) => (
                            <div key={r.id} className="flex flex-col gap-1.5">
                              {r.source === "drive" ? (
                                <span className="provenance">
                                  importé du Drive
                                  {r.fichier_path ? " · PDF" : ""}
                                </span>
                              ) : r.envoye_at ? (
                                <Statut>envoyé le {jourEtMoisCourt(r.envoye_at)}</Statut>
                              ) : null}
                              {r.contenu.trim() ? (
                                <Lisible titre={`Retour d’Émilien · ${profil.prenom}, séance ${s.numero}`} replie>
                                  <TexteLecture>{retourLisible(r.contenu)}</TexteLecture>
                                </Lisible>
                              ) : null}
                              {r.pdf ? (
                                <a href={r.pdf} target="_blank" rel="noreferrer" className="outil self-start text-[12px]">
                                  PDF
                                </a>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <Statut>pas encore de retour</Statut>
                        )}
                        {sansMonRetour ? (
                          <Link href={`/emilien/seances/${s.id}`} className="outil outil-rouge">
                            {o.monRetour ? "Reprendre mon retour →" : "Écrire mon retour →"}
                          </Link>
                        ) : null}
                      </div>

                      {estCoach ? (
                        <div className={`objet objet-prive ${o.preparation?.contenu.trim() ? "col-span-2 md:col-span-full" : ""}`}>
                          <h3 className="font-titre text-[14px] font-semibold text-violet">
                            Ma préparation <span className="font-italique text-[11px] font-normal italic opacity-80">· Cloé seule</span>
                          </h3>
                          {o.preparation?.pdf ? <span className="provenance bg-papier">importé du Drive · PDF</span> : null}
                          {o.preparation?.contenu.trim() ? (
                            <Lisible titre={`Ma préparation · ${profil.prenom}, séance ${s.numero}`} replie>
                              <TexteLecture>{o.preparation.contenu}</TexteLecture>
                            </Lisible>
                          ) : null}
                          {!o.preparation ? <Statut>rien d’écrit</Statut> : null}
                          <div className="flex flex-wrap gap-x-2.5">
                            {o.preparation?.pdf ? (
                              <a href={o.preparation.pdf} target="_blank" rel="noreferrer" className="outil text-[12px]">
                                PDF
                              </a>
                            ) : null}
                            <Link href={`/coach/clientes/${id}/seances/${s.id}/avant`} className="outil text-[12px]">
                              Avant la séance →
                            </Link>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      {o.lettre ? (
                        <div className="flex items-baseline justify-between gap-2.5">
                          <span className="text-[14px] leading-[1.5]">
                            Lettre envoyée après la séance : <span className="font-titre font-semibold text-violet">{titrePropre(o.lettre.titre)}</span>
                            {dateReelle(o.lettre.publiee_at) ? <span className="font-italique text-[12px] italic text-violet"> · {dateReelle(o.lettre.publiee_at)}</span> : null}
                          </span>
                          <Link href={estCoach ? `/coach/clientes/${id}/lettre/${o.lettre.id}` : voirCommeElle} className="outil outil-rouge shrink-0">
                            Voir
                          </Link>
                        </div>
                      ) : estCoach && parcours ? (
                        <form action={creerLettre}>
                          <input type="hidden" name="parcours_id" value={parcours.id} />
                          <input type="hidden" name="cliente_id" value={id} />
                          <input type="hidden" name="seance_id" value={s.id} />
                          <button type="submit" className="outil outil-rouge min-h-[44px]">
                            {o.brouillon ? "Reprendre la lettre →" : "Écrire la lettre →"}
                          </button>
                        </form>
                      ) : (
                        <span className="text-[14px] text-violet/75">Pas de lettre après cette séance.</span>
                      )}

                      {s.mots_cles.length || s.station_validee ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="pr-1 text-[12px] text-violet">Validés, sur son chemin :</span>
                          {s.mots_cles.map((m) => (
                            <span key={m} className="mot-chemin">
                              {m}
                            </span>
                          ))}
                          {s.station_validee ? <span className="mot-chemin bg-rouge">{s.station_validee}</span> : null}
                        </div>
                      ) : null}

                      {aPoser && estCoach ? (
                        <div className="flex flex-col gap-2.5 border-l-[3px] border-rouge bg-beige px-3.5 py-3">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="font-titre text-[13px] font-semibold text-rouge">{proposition ? "Proposés après lecture du transcript" : "Les mots et la station"}</span>
                            {transcriptPret(s) && (s.transcript_formate || s.transcript_segments?.length) ? <ProposerMots seanceId={s.id} dejaPropose={proposition} /> : null}
                          </div>
                          <FormAction action={validerMots} bouton="Valider" rouge>
                            <input type="hidden" name="id" value={s.id} />
                            <div className="grid grid-cols-3 gap-1.5 md:max-w-[680px]">
                              {[0, 1, 2].map((i) => (
                                <input key={i} name={`mot${i + 1}`} aria-label={`mot ${i + 1}`} placeholder={`mot ${i + 1}`} defaultValue={s.mots_proposes[i] ?? ""} className="champ-mot" />
                              ))}
                            </div>
                            <input name="station" aria-label="station sur le chemin" placeholder="station sur le chemin" defaultValue={s.station_proposee ?? ""} className="champ-mot md:max-w-[680px]" />
                          </FormAction>
                        </div>
                      ) : aPoser ? (
                        <span className="text-[12px] text-violet/75">Mots et station : Cloé les pose.</span>
                      ) : null}

                      <Link href={lienSeance(s)} className="font-titre text-[13px] font-semibold text-violet">
                        Ouvrir la séance →
                      </Link>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        {/* 5. Notes d'Émilien */}
        <section className="flex flex-col gap-3 pt-[34px]">
          <Titre>Notes d’Émilien</Titre>
          {estCoach ? (
            <div className="flex flex-wrap items-center -mt-1">
              <Depliant classeBouton="outil outil-rouge" libelle="Déposer une note">
                <DepotFichier avecTitre genre="note" cible={id} accept="application/pdf" titre="Choisir le PDF" aide="elle apparaîtra dans sa mémoire" apres={noteEmilienDeposee.bind(null, id)} />
              </Depliant>
            </div>
          ) : null}
          <div className="flex flex-col border-b border-[var(--filet-papier)]">
            {notes.length ? (
              notes.map((n) => (
                <div key={n.id} className="flex items-center gap-3 border-t border-[var(--filet-papier)] py-3.5">
                  <span aria-hidden="true" className="h-[46px] w-9 shrink-0 rounded-[2px] border border-violet/20 bg-papier-creux" />
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="font-titre text-[16px] font-semibold leading-[1.1]">{n.titre}</span>
                    <span className="font-italique text-[12px] italic text-violet">déposée le {jourEtMois(n.deposee_at)} · visible dans sa mémoire</span>
                  </span>
                  {n.lien ? (
                    <a href={n.lien} target="_blank" rel="noreferrer" className="outil shrink-0">
                      ouvrir
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="m-0 border-t border-[var(--filet-papier)] py-3 text-[14px] text-violet/75">Aucune note déposée.</p>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 items-start md:grid-cols-2 md:gap-x-10">
          {/* 6. Son carnet */}
          <section className="flex flex-col gap-3 pt-[34px]">
            <Titre droite={<span className="font-italique text-[12px] italic text-violet">lecture seule</span>}>Son carnet</Titre>
            {carnet.aborder.map((e) => (
              <Carnet key={e.id} e={e} prenom={profil.prenom} />
            ))}
            {carnet.recents.map((e) => (
              <Carnet key={e.id} e={e} prenom={profil.prenom} />
            ))}
            {!carnet.aborder.length && !carnet.recents.length ? <p className="m-0 text-[14px] text-violet/75">Rien pour l’instant.</p> : null}
            <Link href={`${voirCommeElle}#carnet`} className="py-1 font-titre text-[13px] font-semibold text-violet">
              Tout son carnet, dans son espace →
            </Link>
          </section>

          {/* 7. Ses ressources */}
          <section className="flex flex-col gap-3 pt-[34px]">
            <Titre>Ses ressources</Titre>
            {estCoach && parcours ? (
              <div className="flex flex-wrap items-center -mt-1">
                <Depliant classeBouton="outil outil-rouge" libelle="Partager une ressource">
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
            <div className="flex flex-col border-b border-[var(--filet-papier)]">
              {cartes.length ? (
                cartes.map(({ a, r, statut }) => (
                  <div key={a.id} className="flex items-center gap-3 border-t border-[var(--filet-papier)] py-3.5">
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image_url} alt="" className="h-11 w-11 shrink-0 rounded-[4px] object-cover" />
                    ) : (
                      <span aria-hidden="true" className="h-11 w-11 shrink-0 rounded-[4px] bg-beige" />
                    )}
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5 md:flex-row md:items-center md:gap-3">
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="break-words font-titre text-[14px] font-semibold leading-[1.1]">{titrePropre(r.titre)}</span>
                        <span className="text-[11px] text-violet">{[r.auteur, dateReelle(a.publiee_at) && `partagée le ${dateReelle(a.publiee_at)}`].filter(Boolean).join(" · ")}</span>
                      </span>
                      <span className="segments self-start md:self-auto" role="img" aria-label={`suivi : ${SUIVI.find(([k]) => k === statut)?.[1]}`}>
                        {SUIVI.map(([k, mot]) => (
                          <span key={k} className={k === statut ? "actif" : ""}>
                            {mot}
                          </span>
                        ))}
                      </span>
                    </span>
                  </div>
                ))
              ) : (
                <p className="m-0 border-t border-[var(--filet-papier)] py-3 text-[14px] text-violet/75">Rien de partagé pour l’instant.</p>
              )}
            </div>
          </section>
        </div>

        {/* 8. Compte */}
        <section className="flex flex-col gap-3 pb-[60px] pt-[34px]">
          <h2 className="font-titre text-[20px] font-semibold leading-none tracking-[-0.02em] text-violet">Compte</h2>
          <p className="m-0 text-[13px] leading-[1.7]">
            {profil.email}
            <br />
            {parcours?.drive_folder_id ? `Dossier Drive relié : ${parcours.drive_folder_nom ?? parcours.drive_folder_id}` : "Pas encore de dossier Drive relié"}
          </p>
          {estCoach ? (
            <div className="flex flex-wrap items-center gap-x-[18px]">
              <EnvoiLienAcces surPapier email={profil.email} prenom={profil.prenom} />
              <Link href={voirCommeElle} className="outil">
                Modifier la fiche
              </Link>
            </div>
          ) : null}
          <Link href={voirCommeElle} className="pt-1.5 font-titre text-[15px] font-semibold text-rouge">
            Voir comme elle →
          </Link>
        </section>
      </div>
    </PageCoach>
  );
}
