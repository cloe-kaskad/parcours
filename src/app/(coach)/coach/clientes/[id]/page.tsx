import Link from "next/link";
import { preparationLisible } from "@/lib/version-seance";
import { notFound } from "next/navigation";
import { Marque, PageCoach } from "@/components/coach/base";
import { Barre } from "@/components/coach/Entete";
import { EnvoiLienAcces } from "@/components/coach/EnvoiLienAcces";
import { Depliant, DepotFichier, FormAction } from "@/components/coach/interactifs";
import { Liseuse, OuvrirLecture, type TexteLiseuse } from "@/components/coach/Liseuse";
import { Sections } from "@/components/coach/Sections";
import { TexteLecture, TexteOrigine } from "@/components/coach/TexteLecture";
import { NoteParcours } from "@/components/coach/VueEquipe";
import { VoixCliente } from "@/components/coach/VoixCliente";
import { TraceChemin } from "@/components/espace/TraceChemin";
import { modifierDateDebut, modifierIntention, noteEmilienDeposee } from "@/lib/actions/clientes";
import { partagerRessource } from "@/lib/actions/ressources";
import { creerSeance, enregistrerChemin } from "@/lib/actions/seances";
import { etatSeance, type Point } from "@/lib/agenda";
import { exigerEquipe } from "@/lib/auth";
import { debutDuParcours } from "@/lib/chemin";
import { aConfirmer, avantOuverture, jourEtHeure, jourEtMois, jourEtMoisCourt, moisAnnee, prochaineSeance } from "@/lib/dates";
import { cartesRessources, meteoDuJour } from "@/lib/db/cliente";
import { audiosDe, chargerVueEquipe, filDe, motsRecurrents, parcoursCliente, resumesDuParcours, texteSeance, type ObjetsSeance } from "@/lib/db/coach";
import type { SeanceResume } from "@/lib/supabase/types";
import { ResumeSeance } from "@/components/coach/ResumeSeance";
import { texteRetour, texteStructure } from "@/lib/retour";
import type { Seance } from "@/lib/supabase/types";
import { titrePropre, minutesDeLecture } from "@/lib/textes";

export const metadata = { title: "Vue équipe" };

const SUIVI = { a_voir: "à découvrir", commence: "commencé", termine: "terminé" } as const;
const dateReelle = (d: string | null | undefined) => (d && !avantOuverture(d) ? jourEtMoisCourt(d) : null);
const pluriel = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;

// Les quatre points d'une séance : audio, transcript, Émilien, lettre.
function Points({ points }: { points: Point[] }) {
  const noms = ["audio", "transcript", "retour d’Émilien", "pratiques"];
  const mots: Record<Point, string> = { plein: "fait", vide: "pas encore", retard: "en retard" };
  return (
    <span className="flex shrink-0 items-center gap-1.5" role="img" aria-label={points.map((p, i) => `${noms[i]} ${mots[p]}`).join(", ")}>
      {points.map((p, i) => (
        <span key={i} className={`point point-${p}`} />
      ))}
    </span>
  );
}

const TitreSection = ({ children, droite }: { children: React.ReactNode; droite?: React.ReactNode }) => (
  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pb-2.5">
    <h2 className="m-0 font-titre text-[26px] font-semibold leading-none tracking-[-0.02em] text-violet">{children}</h2>
    {droite}
  </div>
);

// Une section repliée : une ligne avec son compteur, « Ouvrir » la déplie sur place.
function Repli({ titre, compte, children, id }: { titre: string; compte: string; children: React.ReactNode; id?: string }) {
  return (
    <details id={id} className="ancre group border-t border-[var(--filet-papier)]">
      <summary className="flex min-h-[56px] cursor-pointer items-center gap-3 py-3.5">
        <span className="flex min-w-0 flex-col gap-[3px]">
          <span className="font-titre text-[18px] font-semibold leading-[1.1] text-encre">{titre}</span>
          <span className="text-[14px] text-violet">{compte}</span>
        </span>
        <span className="ml-auto shrink-0 font-titre text-[14px] font-semibold text-violet">
          <span className="group-open:hidden">Ouvrir</span>
          <span className="hidden group-open:inline">Replier</span>
        </span>
      </summary>
      <div className="flex flex-col gap-3 pb-4">{children}</div>
    </details>
  );
}

const Puce = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="section-puce">
    {children}
  </Link>
);

export default async function VueEquipe({ params }: PageProps<"/coach/clientes/[id]">) {
  const moi = await exigerEquipe();
  const estCoach = moi.role === "coach";
  const { id } = await params;
  // Tout part en même temps : la fiche, la météo, et ce qui ne dépend que du parcours.
  const annexes = parcoursCliente(id).then((pc) =>
    Promise.all([pc ? cartesRessources(pc.id, id) : Promise.resolve([] as Awaited<ReturnType<typeof cartesRessources>>), pc ? resumesDuParcours(pc.id) : Promise.resolve(new Map<string, SeanceResume>()), filDe(id, "", pc?.id ?? null)]),
  );
  const [d, { etats, meteo, traces }, [cartes, resumes, filBrut]] = await Promise.all([chargerVueEquipe(id, moi), meteoDuJour(id), annexes]);
  if (!d) notFound();
  const { profil, parcours, seances, objets, note, notes, carnet, bibliotheque, aEcrit } = d;
  const fil = filBrut.map((e) => (e.qui ? e : { ...e, qui: profil.prenom }));
  const recurrents = motsRecurrents(seances);
  const p = profil.prenom;

  const parNumero = [...seances].reverse();
  const faites = parNumero.filter((s) => s.statut === "faite");
  const recentes = [...faites].reverse();
  const derniere = recentes[0] ?? null;
  const suivantes = recentes.slice(1, 3);
  const anciennes = recentes.slice(3);
  const prochaine = prochaineSeance(parNumero);
  // Heure de début passée : plus « à venir », il reste à déposer l'audio (ce qui la note comme faite).
  const aDeposer = parNumero.filter((s) => aConfirmer(s));
  const aVenir = parNumero.filter((s) => s.statut === "planifiee" && !aConfirmer(s));
  const annulees = parNumero.filter((s) => s.statut === "annulee");
  const nomDe = (code: string) => etats.find((e) => e.code === code)?.libelle ?? "";
  const lienSeance = (s: Seance) => (estCoach ? `/coach/clientes/${id}/seances/${s.id}` : `/emilien/seances/${s.id}`);
  const voirCommeElle = `/coach/clientes/${id}/espace`;
  const debut = debutDuParcours(parcours?.date_debut, seances);
  const derniereMeteo = meteo ?? traces[0] ?? null;

  // Les séances vécues à dater ou à nommer (mots et station) : un seul bandeau.
  const aNommer = faites.filter((s) => !s.date || (!s.mots_cles.length && !s.station_validee));
  // Émilien : la plus ancienne séance récente sans son retour.
  const sansMonRetour = (s: Seance) => !estCoach && s.statut === "faite" && Boolean(s.date) && !avantOuverture(s.date) && !objets.get(s.id)?.retours.some((r) => r.auteur_id === moi.id);
  const aEcrireEmilien = faites.find(sansMonRetour) ?? null;

  const points = (s: Seance, o: ObjetsSeance): Point[] => {
    const e = etatSeance(s, Boolean(o.lettre));
    return [s.audio_path ? "plein" : "vide", e.points[0], o.retours.length ? "plein" : sansMonRetour(s) ? "retard" : "vide", e.points[2]];
  };

  // Les textes de la dernière séance, dans la liseuse.
  const od = derniere ? objets.get(derniere.id)! : null;
  const textes: TexteLiseuse[] = [];
  if (derniere && od) {
    const retour = od.retours.find((r) => r.contenu.trim());
    if (retour) {
      const t = texteRetour(retour);
      textes.push({
        cle: "emilien",
      source: "retour",
        onglet: "Retour d’Émilien",
        annonce: "le retour d’Émilien",
        titre: `Séance ${derniere.numero} de ${p}`,
        meta: ["Émilien", dateReelle(retour.envoye_at), `${minutesDeLecture(t)} min de lecture`].filter(Boolean).join(" · "),
        contenu: (
          <>
            <TexteLecture>{t}</TexteLecture>
            {retour.contenu_lisible ? <TexteOrigine texte={retour.contenu} /> : null}
          </>
        ),
      });
    }
    const t = texteSeance(derniere);
    if (t) {
      textes.push({
        cle: "transcript",
      source: "transcript",
        onglet: "Transcript",
        annonce: "le transcript",
        titre: `Séance ${derniere.numero} de ${p}`,
        meta: ["Le transcript", dateReelle(derniere.date), `${minutesDeLecture(t)} min de lecture`].filter(Boolean).join(" · "),
        contenu: <TexteLecture>{texteStructure(t)}</TexteLecture>,
      });
    }
    if (od.lettre) {
      const l = od.lettre.contenu || od.lettre.intro;
      textes.push({
        cle: "lettre",
      source: "lettre",
        onglet: "Pratiques",
        annonce: "les pratiques",
        titre: titrePropre(od.lettre.titre),
        meta: [dateReelle(od.lettre.publiee_at) ? `envoyée le ${dateReelle(od.lettre.publiee_at)}` : null, `${minutesDeLecture(l)} min de lecture`].filter(Boolean).join(" · "),
        contenu: <TexteLecture>{l}</TexteLecture>,
      });
    }
    if (estCoach && od.preparation?.contenu.trim()) {
      textes.push({ cle: "prepa", onglet: "Prépa", annonce: "ta préparation", titre: `Ma préparation, séance ${derniere.numero}`, meta: "toi seule", contenu: <TexteLecture>{preparationLisible(od.preparation.contenu)}</TexteLecture> });
    }
    if (estCoach && od.notesSeance.trim()) {
      textes.push({ cle: "notes", onglet: "Mes notes", annonce: "tes notes de séance", titre: `Mes notes, séance ${derniere.numero}`, meta: "prises pendant la séance · toi seule", contenu: <p className="m-0 whitespace-pre-line text-[17px] leading-[1.65]">{od.notesSeance}</p> });
    }
  }
  const aTexte = (cle: string) => textes.some((t) => t.cle === cle);

  const nouveaux = [...carnet.aborder, ...carnet.recents].filter((e) => e.vu_par_coach_at === null).length;
  const premiere = carnet.aborder[0] ?? carnet.recents[0] ?? null;
  const audioPremiere = premiere ? ((await audiosDe([premiere])).get(premiere.id) ?? null) : null;
  const autres = Math.max(0, carnet.total - (premiere ? 1 : 0));
  const autresAborder = Math.max(0, carnet.aborder.length - (premiere?.pour_prochaine_seance ? 1 : 0));
  const commencees = cartes.filter((c) => c.statut === "commence").length;
  const terminees = cartes.filter((c) => c.statut === "termine").length;

  const sections = [
    { id: "ou", libelle: "Où elle en est" },
    { id: "seances", libelle: "Séances" },
    { id: "carnet", libelle: nouveaux ? `Carnet · ${nouveaux}` : "Carnet" },
    { id: "ressources", libelle: "Ressources" },
    { id: "notes", libelle: "Notes" },
    ...(estCoach ? [{ id: "compte", libelle: "Compte" }] : []),
  ];

  // Une ligne de séance repliée : date, mots validés, points, et l'accès à la séance.
  const ligne = (s: Seance) => {
    const o = objets.get(s.id)!;
    const ecrire = sansMonRetour(s);
    return (
      <Link key={s.id} href={ecrire ? `/emilien/seances/${s.id}` : lienSeance(s)} className="flex min-h-[56px] items-center gap-3 border-t border-[var(--filet-papier)] py-3.5">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="font-titre text-[18px] font-semibold leading-[1.1] text-encre">
            Séance {s.numero} <span className="font-sans text-[14px] font-normal text-violet">· {s.date ? jourEtMoisCourt(s.date) : "sans date"}</span>
          </span>
          {s.mots_cles.length ? (
            <span className="font-titre text-[14px] font-medium text-rouge">{s.mots_cles.join(" · ")}</span>
          ) : s.mots_proposes.length ? (
            <span className="font-titre text-[14px] font-medium text-violet/80">
              {s.mots_proposes.join(" · ")} <span className="font-sans text-[13px] font-normal">· proposés{s.station_proposee && !s.station_validee ? `, station « ${s.station_proposee} »` : ""}</span>
            </span>
          ) : null}
        </span>
        <span className="ml-auto">
          <Points points={points(s, o)} />
        </span>
        <span className={`shrink-0 font-titre text-[14px] font-semibold ${ecrire ? "text-rouge" : "text-violet"}`}>{ecrire ? "Écrire mon retour" : "›"}</span>
      </Link>
    );
  };

  const ouElleEnEst = (
    <section id="ou" className="ancre order-1 flex flex-col gap-3">
      <TitreSection>Où elle en est</TitreSection>
      {parcours ? <NoteParcours parcoursId={parcours.id} texte={note?.note_equipe ?? ""} signature={note?.note_equipe.trim() ? `${note.auteur ?? "l’équipe"} · ${jourEtMoisCourt(note.note_equipe_modifiee_at)}` : null} /> : null}
      <details className="group">
        <summary className="cursor-pointer text-[15px] leading-[1.55]">
          <span className="font-titre font-semibold text-violet">Intention.</span> <span className="group-open:hidden">{(parcours?.intention.trim() || "pas encore écrite.").slice(0, 60)}{(parcours?.intention.trim().length ?? 0) > 60 ? "…" : ""}</span>{" "}
          <span className="outil text-[14px] group-open:hidden">lire</span>
        </summary>
        <div className="flex flex-col gap-1 pt-1">
          <p className="m-0 text-[15px] leading-[1.55]">{parcours?.intention.trim() || "Pas encore écrite."}</p>
          {estCoach && parcours ? (
            <div className="flex flex-wrap items-center gap-x-4">
              <Depliant classeBouton="outil min-h-[44px] text-[14px]" libelle="modifier">
                <FormAction action={modifierIntention} bouton="Enregistrer">
                  <input type="hidden" name="parcours_id" value={parcours.id} />
                  <textarea name="intention" aria-label="L’intention du parcours" defaultValue={parcours.intention} className="champ-zone min-h-[120px]" />
                </FormAction>
              </Depliant>
              <Depliant classeBouton="outil min-h-[44px] text-[14px]" libelle={parcours.date_debut ? `début : ${moisAnnee(parcours.date_debut)}` : "date de début"}>
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
      </details>
      <TraceChemin bande debut={debut} stations={faites.map((s) => ({ id: s.id, nom: s.station_validee ?? s.mots_cles[0] ?? null }))} graine={parcours?.id ?? id} />
      {estCoach && faites.length ? (
        <div className="-mt-1 flex flex-wrap items-center">
          <Depliant classeBouton="outil min-h-[44px] text-[14px]" libelle="modifier le chemin">
            <FormAction action={enregistrerChemin} bouton="Enregistrer">
              {faites.map((s) => (
                <label key={s.id} className="etiquette">
                  séance {s.numero}
                  <input name={`station_${s.id}`} defaultValue={s.station_validee ?? ""} placeholder={s.station_proposee ? `proposée : ${s.station_proposee}` : "le nom de cette station"} className="champ" />
                </label>
              ))}
            </FormAction>
          </Depliant>
        </div>
      ) : null}
      <p className="m-0 text-[14px]">
        Météo :{" "}
        {derniereMeteo ? (
          <>
            <span className="font-titre font-semibold text-violet">{nomDe(derniereMeteo.etat_code)}</span> <span className="text-violet">· {meteo ? "aujourd’hui" : jourEtMoisCourt(derniereMeteo.date)}</span>
          </>
        ) : (
          <span className="text-violet">pas encore</span>
        )}
      </p>
    </section>
  );

  const reste = (
    <div className="order-4 flex flex-col border-b border-[var(--filet-papier)]">
      {recurrents.lignes.length ? (
        <Repli id="mots" titre="Les mots qui reviennent" compte={`${recurrents.lignes.map((l) => l.mot.toLowerCase()).slice(0, 3).join(", ")}…`}>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {recurrents.lignes.map((l) => (
              <li key={l.mot} className="flex flex-col gap-1">
                <span className="font-titre text-[15px] font-semibold text-encre">{l.mot}</span>
                <span className="flex flex-wrap gap-1" role="img" aria-label={`présent dans ${l.presences.filter(Boolean).length} séances sur ${l.presences.length}`}>
                  {l.presences.map((p, i) => (
                    <span key={i} title={`séance ${recurrents.numeros[i]}`} className={`size-2.5 rounded-full border-[1.5px] border-violet ${p ? "bg-violet" : "opacity-35"}`} />
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-[14px] text-violet">séances {recurrents.numeros[0]} à {recurrents.numeros.at(-1)}, dans les transcripts (les séances sans texte comptent vides)</p>
        </Repli>
      ) : null}
      {fil.length ? (
        <Repli id="fil" titre="Le fil" compte={`${fil.length} moments depuis l’ouverture`}>
          <ol className="m-0 flex list-none flex-col p-0">
            {fil.map((e, i) => (
              <li key={i} className="flex gap-3 border-t border-[var(--filet-papier)] py-2 first:border-t-0">
                <span className="w-[52px] shrink-0 text-[14px] text-violet">{jourEtMoisCourt(e.date)}</span>
                <span className="text-[14px] leading-[1.5]">
                  <strong className="font-semibold">{e.qui}</strong> {e.quoi}
                </span>
              </li>
            ))}
          </ol>
        </Repli>
      ) : null}
      <Repli id="ressources" titre="Ses ressources" compte={cartes.length ? [pluriel(cartes.length, "partagée", "partagées"), commencees ? pluriel(commencees, "commencée", "commencées") : null, terminees ? pluriel(terminees, "terminée", "terminées") : null].filter(Boolean).join(" · ") : estCoach ? "aucune partagée" : "aucune partagée · tu peux en proposer une"}>
        {estCoach && parcours ? (
          <div className="flex flex-wrap items-center">
            <Depliant classeBouton="outil outil-rouge min-h-[44px] text-[14px]" libelle="Partager une ressource">
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
        {cartes.map(({ a, r, statut }) => (
          <div key={a.id} className="flex items-center gap-3">
            {r.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.image_url} alt="" className={`size-11 shrink-0 rounded-[4px] object-cover ${statut === "a_voir" ? "opacity-45" : ""}`} />
            ) : (
              <span aria-hidden className="size-11 shrink-0 rounded-[4px] bg-beige" />
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="break-words font-titre text-[15px] font-semibold leading-[1.15]">{titrePropre(r.titre)}</span>
              <span className="text-[14px] text-violet">{[SUIVI[statut], dateReelle(a.publiee_at) && `partagée le ${dateReelle(a.publiee_at)}`].filter(Boolean).join(" · ")}</span>
            </span>
          </div>
        ))}
      </Repli>

      {notes.length ? (
        <Repli id="notes" titre="Notes d’Émilien" compte={`${pluriel(notes.length, "note", "notes")} · visibles dans sa mémoire`}>
          {notes.map((n) => (
            <div key={n.id} className="flex items-center gap-3">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-titre text-[16px] font-semibold leading-[1.1]">{n.titre}</span>
                <span className="text-[14px] text-violet">déposée le {jourEtMois(n.deposee_at)}</span>
              </span>
              {n.lien ? (
                <a href={n.lien} target="_blank" rel="noreferrer" className="outil inline-flex min-h-[44px] shrink-0 items-center text-[14px]">
                  ouvrir
                </a>
              ) : null}
            </div>
          ))}
          {estCoach ? (
            <div className="flex flex-wrap items-center">
              <Depliant classeBouton="outil min-h-[44px] text-[14px]" libelle="Déposer une note">
                <DepotFichier avecTitre genre="note" cible={id} accept="application/pdf" titre="Choisir le PDF" aide="elle apparaîtra dans sa mémoire" apres={noteEmilienDeposee.bind(null, id)} />
              </Depliant>
            </div>
          ) : null}
        </Repli>
      ) : (
        <div id="notes" className="ancre flex flex-wrap items-center gap-x-2 border-t border-[var(--filet-papier)] py-3 text-[14px] text-violet">
          Notes d’Émilien : aucune.
          {estCoach ? (
            <Depliant classeBouton="outil min-h-[44px] text-[14px]" libelle="Déposer">
              <DepotFichier avecTitre genre="note" cible={id} accept="application/pdf" titre="Choisir le PDF" aide="elle apparaîtra dans sa mémoire" apres={noteEmilienDeposee.bind(null, id)} />
            </Depliant>
          ) : null}
        </div>
      )}

      {estCoach ? (
        <Link href={`/coach/clientes/${id}/bilan`} className="flex min-h-[56px] items-center gap-3 border-t border-[var(--filet-papier)] py-3.5">
          <span className="flex min-w-0 flex-col gap-[3px]">
            <span className="font-titre text-[18px] font-semibold leading-[1.1] text-encre">Bilan de cycle</span>
            <span className="text-[14px] text-violet">chemin, mots, pratiques, ce qu’elle a écrit, en PDF</span>
          </span>
          <span className="ml-auto shrink-0 font-titre text-[14px] font-semibold text-violet">Préparer</span>
        </Link>
      ) : null}
      {estCoach ? (
        <Repli id="compte" titre="Compte" compte={`${profil.email} · ${parcours?.drive_folder_id ? "Drive relié" : "Drive non relié"}`}>
          <p className="m-0 text-[14px] leading-[1.6]">{parcours?.drive_folder_id ? `Dossier Drive : ${parcours.drive_folder_nom ?? parcours.drive_folder_id}` : "Pas encore de dossier Drive relié."}</p>
          <div className="flex flex-wrap items-center gap-x-[18px]">
            <EnvoiLienAcces surPapier email={profil.email} prenom={p} />
            <Link href={voirCommeElle} className="outil inline-flex min-h-[44px] items-center text-[14px]">
              Modifier la fiche
            </Link>
          </div>
        </Repli>
      ) : null}
    </div>
  );

  return (
    <PageCoach>
      <Barre retour={estCoach ? { href: "/coach", libelle: "Agenda" } : { href: "/emilien", libelle: "À lire" }} cliente={p} />

      {/* L'en-tête compact, sans couverture */}
      <div className="bg-violet px-[22px] pb-5 pt-1.5 text-creme lg:px-10 lg:pb-[26px] lg:pt-[22px]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-end justify-between gap-2.5 lg:justify-start lg:gap-4">
              <h1 className="m-0 font-titre text-[44px] font-semibold leading-[0.9] tracking-[-0.03em] text-creme lg:text-[72px] lg:leading-[0.85]">{p}</h1>
              {aEcrit ? <Marque className="lg:mb-1.5">a écrit · {jourEtMoisCourt(aEcrit)}</Marque> : null}
            </div>
            <p className="m-0 text-[14px] lg:text-[15px]">
              {prochaine?.date ? `Séance ${prochaine.numero} ${jourEtHeure(prochaine.date).replace(" · ", ", ")}` : prochaine ? `Séance ${prochaine.numero} à dater` : "Pas de prochaine séance"}
              {debut ? <span className="opacity-75"> · depuis {moisAnnee(debut)}</span> : null}
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            {estCoach && aDeposer.length ? (
              <Link href={`${lienSeance(aDeposer[aDeposer.length - 1])}#audio`} className="pilule pilule-rouge min-h-[44px]">
                Déposer l’audio · séance {aDeposer[aDeposer.length - 1].numero}
              </Link>
            ) : null}
            {estCoach && prochaine ? (
              <Link href={`/coach/clientes/${id}/seances/${prochaine.id}/avant`} className={`pilule min-h-[44px] ${aDeposer.length ? "" : "pilule-rouge"}`}>
                Préparer la séance
              </Link>
            ) : null}
            {aEcrireEmilien ? (
              <Link href={`/emilien/seances/${aEcrireEmilien.id}`} className="pilule pilule-rouge min-h-[44px]">
                Écrire mon retour · séance {aEcrireEmilien.numero}
              </Link>
            ) : null}
            <Link href={voirCommeElle} className="pilule min-h-[44px]">
              Voir comme elle
            </Link>
            <Link href={`/coach/chercher?cliente=${id}`} className="pilule min-h-[44px]">
              Chercher chez elle
            </Link>
            {estCoach && parcours ? (
              <Depliant classeBouton="pilule min-h-[44px]" libelle="Nouvelle séance">
                <div className="carte-blanche p-3">
                  <FormAction action={creerSeance} bouton="Créer la séance" rouge>
                    <input type="hidden" name="parcours_id" value={parcours.id} />
                    <label className="etiquette">
                      date et heure
                      <input type="datetime-local" name="date" className="champ" />
                    </label>
                  </FormAction>
                </div>
              </Depliant>
            ) : null}
          </div>
        </div>
      </div>

      <Sections sections={sections} className="lg:hidden" />

      <Liseuse textes={textes} epingle={parcours ? { parcoursId: parcours.id, seanceId: prochaine?.id ?? null } : undefined}>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[30px] px-[22px] pb-16 pt-[22px] lg:grid lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:gap-[70px] lg:px-10 lg:pt-[34px]">
          {/* Gauche sur ordinateur : séances et carnet. Sur téléphone, les sections s'ordonnent. */}
          <div className="contents lg:flex lg:flex-col lg:gap-[34px]">
            <section id="seances" className="ancre order-2 flex flex-col">
              <TitreSection droite={<span className="text-[14px] text-violet">audio · transcript · Émilien · pratiques</span>}>Les séances</TitreSection>
              {estCoach && aNommer.length ? (
                <Link href={`/coach/clientes/${id}/dater`} className="mb-1 flex min-h-[48px] items-center justify-between gap-2.5 border-l-[3px] border-rouge bg-beige px-3.5 py-3">
                  <span className="text-[15px] text-encre">
                    <strong className="font-semibold">{pluriel(aNommer.length, "séance", "séances")}</strong> à dater et nommer
                    {aNommer.some((x) => !x.mots_cles.length && x.mots_proposes.length) ? <span className="block text-[14px] text-violet">des mots et stations sont déjà proposés, à valider</span> : null}
                  </span>
                  <span className="whitespace-nowrap font-titre text-[14px] font-semibold text-rouge">Les faire à la suite →</span>
                </Link>
              ) : null}
              {!seances.length ? <p className="m-0 border-t border-[var(--filet-papier)] py-3 text-[15px] text-violet">Aucune séance pour l’instant.</p> : null}

              {aDeposer.map((s) => (
                <div key={s.id} className="flex min-h-[56px] items-center gap-3 border-t border-[var(--filet-papier)] py-3.5">
                  <Link href={lienSeance(s)} className="flex min-h-[44px] min-w-0 flex-col justify-center gap-1">
                    <span className="font-titre text-[18px] font-semibold leading-[1.1] text-encre">
                      Séance {s.numero} <span className="font-sans text-[14px] font-normal text-violet">· {jourEtMoisCourt(s.date!)}</span>
                    </span>
                    <span className="text-[14px] text-rouge">a eu lieu ? audio à déposer</span>
                  </Link>
                  {estCoach ? (
                    <Link href={`${lienSeance(s)}#audio`} className="bouton-rouge ml-auto inline-flex shrink-0 items-center !px-4 !text-[15px]">
                      Déposer l’audio
                    </Link>
                  ) : null}
                </div>
              ))}

              {aVenir.map((s) => (
                <div key={s.id} className="flex min-h-[56px] items-center gap-3 border-t border-[var(--filet-papier)] py-3.5">
                  <Link href={lienSeance(s)} className="inline-flex min-h-[44px] min-w-0 items-center font-titre text-[18px] font-semibold leading-[1.1] text-encre">
                    <span>
                      Séance {s.numero} <span className="font-sans text-[14px] font-normal text-violet">· {s.date ? jourEtMoisCourt(s.date) : "sans date"} · à venir</span>
                    </span>
                  </Link>
                  {estCoach ? (
                    <Link href={`/coach/clientes/${id}/seances/${s.id}/avant`} className="ml-auto inline-flex min-h-[44px] shrink-0 items-center font-titre text-[14px] font-semibold text-rouge">
                      Préparer
                    </Link>
                  ) : null}
                </div>
              ))}

              {annulees.map((s) => (
                <Link key={s.id} href={lienSeance(s)} className="flex min-h-[56px] items-center gap-3 border-t border-[var(--filet-papier)] py-3.5 opacity-60">
                  <span className="font-titre text-[18px] font-semibold leading-[1.1] text-encre">
                    Séance {s.numero} <span className="font-sans text-[14px] font-normal text-violet">· {s.date ? jourEtMoisCourt(s.date) : "sans date"} · annulée</span>
                  </span>
                  <span className="ml-auto shrink-0 font-titre text-[14px] font-semibold text-violet">›</span>
                </Link>
              ))}

              {derniere && od ? (
                <div className="flex flex-col gap-2.5 border-t border-[var(--filet-papier)] pb-4 pt-3.5">
                  <div className="flex items-center gap-2.5">
                    <Link href={lienSeance(derniere)} className="font-titre text-[18px] font-semibold leading-[1.1] text-encre">
                      Séance {derniere.numero} <span className="font-sans text-[14px] font-normal text-violet">· {derniere.date ? jourEtMoisCourt(derniere.date) : "sans date"}</span>
                    </Link>
                    <span className="ml-auto">
                      <Points points={points(derniere, od)} />
                    </span>
                  </div>
                  <ResumeSeance seanceId={derniere.id} resume={resumes.get(derniere.id)?.resume ?? null} propose={resumes.get(derniere.id)?.resume_propose ?? null} estCoach={estCoach} />
                  {derniere.mots_cles.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {derniere.mots_cles.map((m) => (
                        <span key={m} className="mot-chemin">
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : derniere.mots_proposes.length ? (
                    // Proposés depuis le transcript, pas encore validés : bordés, sans fond, pour ne pas les confondre.
                    <div className="flex flex-wrap items-center gap-1.5">
                      {derniere.mots_proposes.map((m) => (
                        <span key={m} className="mot-chemin !border !border-dashed !border-violet/50 !bg-transparent !text-violet">
                          {m}
                        </span>
                      ))}
                      <span className="text-[13px] text-violet/85">
                        proposés{derniere.station_proposee && !derniere.station_validee ? `, station « ${derniere.station_proposee} »` : ""}
                        {estCoach ? (
                          <>
                            {" · "}
                            <Link href={`/coach/clientes/${id}/dater?s=${derniere.id}`} className="font-titre font-semibold text-rouge underline underline-offset-[3px]">
                              valider
                            </Link>
                          </>
                        ) : null}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {od.audio ? <Puce href={`${lienSeance(derniere)}#audio`}>Écouter</Puce> : null}
                    {aTexte("transcript") ? <OuvrirLecture cle="transcript" className="section-puce">Transcript</OuvrirLecture> : null}
                    {aTexte("emilien") ? <OuvrirLecture cle="emilien" className="section-puce">Retour d’Émilien</OuvrirLecture> : null}
                    {aTexte("lettre") ? <OuvrirLecture cle="lettre" className="section-puce">Pratiques</OuvrirLecture> : null}
                    {aTexte("prepa") ? <OuvrirLecture cle="prepa" className="section-puce">Ma prépa</OuvrirLecture> : null}
                    {aTexte("notes") ? <OuvrirLecture cle="notes" className="section-puce">Mes notes</OuvrirLecture> : null}
                    {sansMonRetour(derniere) ? <Puce href={`/emilien/seances/${derniere.id}`}>Écrire mon retour</Puce> : null}
                  </div>
                </div>
              ) : null}

              {suivantes.map(ligne)}

              {anciennes.length ? (
                <details className="group border-t border-[var(--filet-papier)]">
                  <summary className="flex min-h-[56px] cursor-pointer items-center gap-3 py-3.5">
                    <span className="text-[14px] text-violet">
                      Les séances {anciennes.at(-1)!.numero} à {anciennes[0].numero}
                    </span>
                    <span className="ml-auto font-titre text-[14px] font-semibold text-violet">
                      <span className="group-open:hidden">Voir</span>
                      <span className="hidden group-open:inline">Replier</span>
                    </span>
                  </summary>
                  {anciennes.map(ligne)}
                </details>
              ) : null}
              <div className="border-t border-[var(--filet-papier)]" />
            </section>

            <section id="carnet" className="ancre order-3 flex flex-col">
              <TitreSection droite={nouveaux ? <Marque>{pluriel(nouveaux, "nouveau", "nouveaux")}</Marque> : null}>Son carnet</TitreSection>
              {premiere ? (
                <VoixCliente prenom={p} date={avantOuverture(premiere.date) ? null : jourEtMois(premiere.date)} texte={premiere.contenu} aAborder={premiere.pour_prochaine_seance} nouveau={premiere.vu_par_coach_at === null && estCoach} audio={audioPremiere} compact />
              ) : (
                <p className="m-0 border-t border-[var(--filet-papier)] py-3 text-[14px] text-violet">Son carnet : rien pour l’instant.</p>
              )}
              {autres ? (
                <Link href={`${voirCommeElle}#carnet`} className="mt-2 flex min-h-[56px] items-center gap-3 border-y border-[var(--filet-papier)] py-3.5">
                  <span className="text-[14px] text-violet">
                    {pluriel(autres, "autre entrée", "autres entrées")}
                    {autresAborder ? `, dont ${autresAborder} à aborder` : ""}
                  </span>
                  <span className="ml-auto font-titre text-[14px] font-semibold text-violet">Ouvrir</span>
                </Link>
              ) : null}
            </section>
          </div>

          {/* Droite sur ordinateur : une colonne fixe. */}
          <div className="contents lg:sticky lg:top-5 lg:flex lg:flex-col lg:gap-[30px]">
            {ouElleEnEst}
            {reste}
          </div>
        </div>
      </Liseuse>
    </PageCoach>
  );
}
