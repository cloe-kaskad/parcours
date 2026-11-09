import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Barre, Colonne, LienRose, PageCoach } from "@/components/coach/base";
import { DepotFichier, FormAction, LecteurAudio } from "@/components/coach/interactifs";
import { MotsStation } from "@/components/coach/MotsStation";
import { Calendrier } from "@/components/espace/Calendrier";
import { creerLettre } from "@/lib/actions/lettres";
import { audioDepose, relancerTranscription, enregistrerDate, enregistrerTranscript, modifierSeance, noterEmilienPrevenu, pdfTranscriptDepose } from "@/lib/actions/seances";
import { etatSeance } from "@/lib/agenda";
import { exigerEquipe } from "@/lib/auth";
import { avantOuverture, jourComplet, jourEtMois, pourInputDateHeure } from "@/lib/dates";
import { chargerSeanceCoach, texteSeance } from "@/lib/db/coach";
import { titrePropre } from "@/lib/textes";

export const metadata = { title: "La séance" };

function Etape({ n, etat, titre, statut, children, retard = false }: { n: number; etat: "fait" | "a-venir" | "retard" | "en-cours"; titre: string; statut: string; children?: React.ReactNode; retard?: boolean }) {
  return (
    <section className="flex items-start gap-3.5 border-t border-[var(--filet-papier)] pb-[22px] pt-[18px]">
      <div className={`numero numero-${etat}`} aria-hidden="true">
        {n}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h2 className="font-titre text-[20px] font-semibold leading-none">{titre}</h2>
        <p className={`text-[13px] ${retard ? "text-rouge" : "text-violet/85"}`}>{statut}</p>
        {children}
      </div>
    </section>
  );
}

function PlusDe({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="inline-flex min-h-[44px] cursor-pointer items-center text-[12px] text-violet underline">{libelle}</summary>
      <div className="flex flex-col gap-2 pt-1">{children}</div>
    </details>
  );
}

function duree(sec: number | null) {
  if (!sec) return "";
  const min = Math.round(sec / 60);
  return min >= 60 ? ` · ${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}` : ` · ${min} min`;
}

export default async function SeanceCoach({ params }: PageProps<"/coach/clientes/[id]/seances/[seanceId]">) {
  const profil = await exigerEquipe();
  const { id, seanceId } = await params;
  if (profil.role === "relecteur") redirect(`/emilien/seances/${seanceId}`);
  const d = await chargerSeanceCoach(seanceId);
  if (!d || d.cliente.id !== id) notFound();
  const { seance, cliente, parcours, transcription, retours, lettres, audio, pdf } = d;
  const enCours = transcription?.statut === "en_cours" || transcription?.statut === "en_attente";
  const enErreur = transcription?.statut === "erreur" && !etatSeance(seance, false).transcript;
  const envoyee = lettres.find((l) => l.publiee_at);
  const brouillon = lettres.find((l) => !l.publiee_at);
  const etat = etatSeance(seance, Boolean(envoyee));
  const faite = seance.statut === "faite";
  const texte = texteSeance(seance);
  const dateReelle = (x: string | null) => (x && !avantOuverture(x) ? ` le ${jourEtMois(x)}` : "");

  return (
    <PageCoach>
      <Barre retour={{ href: "/coach", libelle: "Agenda" }} droite={<LienRose href={`/coach/clientes/${id}`}>Fiche de {cliente.prenom}</LienRose>} />
      <Colonne className="pb-16">
        <header className="flex items-center gap-4 pt-[30px]">
          {seance.date ? <Calendrier date={seance.date} prochaine surPapier /> : null}
          <div className="flex flex-col gap-1">
            <h1 className="font-titre text-[36px] font-semibold leading-[0.95] tracking-[-0.03em] text-violet">
              {cliente.prenom} · séance {seance.numero}
            </h1>
            {seance.date ? <p className="font-italique text-[14px] italic text-violet/80">{jourComplet(seance.date)}{duree(seance.audio_duree_sec)}</p> : null}
          </div>
        </header>

        <div className="pt-3">
          <PlusDe libelle={seance.date ? "modifier la date" : "ajouter la date"}>
            {seance.date ? (
              <FormAction action={modifierSeance} bouton="Enregistrer">
                <input type="hidden" name="id" value={seance.id} />
                <label className="etiquette">
                  date et heure
                  <input type="datetime-local" name="date" defaultValue={pourInputDateHeure(seance.date)} className="champ" />
                </label>
                <label className="flex min-h-[44px] items-center gap-2 text-[14px] text-violet">
                  <input type="checkbox" name="faite" defaultChecked={faite} /> la séance a eu lieu
                </label>
              </FormAction>
            ) : (
              <FormAction action={enregistrerDate} bouton="Enregistrer">
                <input type="hidden" name="id" value={seance.id} />
                <input type="datetime-local" name="date" aria-label="Date et heure" className="champ" />
              </FormAction>
            )}
          </PlusDe>
        </div>

        {!faite ? (
          <Link href={`/coach/clientes/${id}/seances/${seance.id}/avant`} className="t-action py-2 text-[18px] text-rouge">
            Avant la séance →
          </Link>
        ) : null}

        <p className="pt-[18px] font-italique text-[14px] italic text-violet">Le soir de la séance, en quatre temps</p>
        <div className="flex flex-col border-b border-[var(--filet-papier)] pt-3">
          <Etape n={1} etat={audio ? "fait" : "a-venir"} titre="Audio" statut={audio ? `reçu${seance.audio_source === "drive" ? " depuis le Drive" : ""}${duree(seance.audio_duree_sec)}` : "pas encore d’audio"}>
            {audio ? <LecteurAudio src={audio} dureeConnue={seance.audio_duree_sec} /> : null}
            {audio ? (
              <PlusDe libelle="remplacer l’audio">
                <DepotFichier genre="audio" cible={seance.id} accept="audio/*,.m4a,.mp3,.wav" titre="Déposer l’audio" aide="glisser ici, ou choisir un fichier depuis le téléphone" apres={audioDepose.bind(null, seance.id)} />
              </PlusDe>
            ) : (
              <DepotFichier genre="audio" cible={seance.id} accept="audio/*,.m4a,.mp3,.wav" titre="Déposer l’audio" aide="glisser ici, ou choisir un fichier depuis le téléphone" apres={audioDepose.bind(null, seance.id)} />
            )}
          </Etape>

          <Etape n={2} etat={enCours ? "en-cours" : enErreur ? "retard" : etat.points[0] === "plein" ? "fait" : etat.points[0] === "retard" ? "retard" : "a-venir"} retard={!enCours && (enErreur || etat.points[0] === "retard")} titre="Transcript" statut={enCours ? "transcription en cours, reviens dans quelques minutes" : enErreur ? "la transcription n’a pas abouti" : etat.transcript ? "prêt" : etat.points[0] === "retard" ? etat.libelle : "pas encore de transcript"}>
            {enErreur && audio ? (
              <FormAction action={relancerTranscription} bouton="Relancer la transcription" rouge>
                <input type="hidden" name="id" value={seance.id} />
              </FormAction>
            ) : null}
            {texte ? <p className="line-clamp-3 whitespace-pre-line text-[15px] leading-[1.55] opacity-85">{texte}</p> : null}
            <div className="flex flex-wrap items-baseline gap-4">
              {pdf ? (
                <a href={pdf} target="_blank" rel="noreferrer" className="t-action text-[15px] text-violet">
                  Lire le PDF →
                </a>
              ) : null}
            </div>
            <PlusDe libelle={texte ? "corriger" : "coller le texte"}>
              <FormAction action={enregistrerTranscript} bouton="Enregistrer">
                <input type="hidden" name="id" value={seance.id} />
                <textarea name="transcript" aria-label="Le transcript" defaultValue={seance.transcript_formate ?? ""} className="champ-zone min-h-[200px]" />
              </FormAction>
            </PlusDe>
            <PlusDe libelle={pdf ? "remplacer le PDF" : "déposer un PDF"}>
              <DepotFichier genre="pdf" cible={seance.id} accept="application/pdf" titre="Déposer le PDF" aide="le document du transcript" apres={pdfTranscriptDepose.bind(null, seance.id)} />
            </PlusDe>
            {faite ? <MotsStation id={seance.id} valides={seance.mots_cles} station={seance.station_validee} proposes={seance.mots_proposes} stationProposee={seance.station_proposee} prenom={cliente.prenom} /> : null}
          </Etape>

          <Etape n={3} etat={etat.emilien ? "fait" : "a-venir"} titre="Émilien" statut={etat.emilien ? `prévenu${dateReelle(seance.emilien_notifie_at ?? seance.envoye_emilien_at)}${retours.length ? " · retour reçu" : ""}` : "pas encore prévenu"}>
            {retours.map((r) => (
              <p key={r.id} className="whitespace-pre-line font-italique text-[15px] italic leading-[1.55] text-violet">
                {r.contenu}
              </p>
            ))}
            {!etat.emilien ? (
              <FormAction action={noterEmilienPrevenu} bouton="Noter qu’il est prévenu">
                <input type="hidden" name="id" value={seance.id} />
              </FormAction>
            ) : null}
          </Etape>

          <Etape n={4} etat={etat.points[2] === "plein" ? "fait" : etat.points[2] === "retard" ? "retard" : "a-venir"} retard={etat.points[2] === "retard"} titre="Exercices" statut={envoyee ? `lettre « ${titrePropre(envoyee.titre)} » envoyée${dateReelle(envoyee.publiee_at)}` : etat.points[2] === "retard" ? etat.libelle : brouillon ? "un brouillon est en cours" : "lettre à écrire"}>
            {envoyee ? (
              <Link href={`/coach/clientes/${id}/lettre/${envoyee.id}`} className="t-action text-[15px] text-violet">
                Voir la lettre →
              </Link>
            ) : (
              <form action={creerLettre}>
                <input type="hidden" name="parcours_id" value={parcours.id} />
                <input type="hidden" name="cliente_id" value={id} />
                <input type="hidden" name="seance_id" value={seance.id} />
                <button type="submit" className="bouton-rouge">
                  {brouillon ? "Reprendre le brouillon" : "Écrire la lettre"}
                </button>
              </form>
            )}
          </Etape>
        </div>
      </Colonne>
    </PageCoach>
  );
}
