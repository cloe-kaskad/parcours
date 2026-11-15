import { notFound } from "next/navigation";
import { PageCoach } from "@/components/coach/base";
import { Barre } from "@/components/coach/Entete";
import { Liseuse, OuvrirLecture, type TexteLiseuse } from "@/components/coach/Liseuse";
import { ModeEnSeance } from "@/components/coach/ModeEnSeance";
import { PetitLecteur } from "@/components/coach/PetitLecteur";
import { PhraseCle } from "@/components/coach/PhraseCle";
import { CopierDossier, Preparation } from "@/components/coach/Preparation";
import { Sections } from "@/components/coach/Sections";
import { TexteLecture, TexteOrigine } from "@/components/coach/TexteLecture";
import { VoixCliente } from "@/components/coach/VoixCliente";
import { Calendrier } from "@/components/espace/Calendrier";
import { exigerEquipe } from "@/lib/auth";
import { avantOuverture, jourEtHeure, jourEtMois, jourEtMoisCourt } from "@/lib/dates";
import { chargerAvant, echangesDe, epinglesDe, resumesDe, texteSeance } from "@/lib/db/coach";
import { FilEchanges } from "@/components/coach/FilEchanges";
import { retirerEpingle } from "@/lib/actions/epingles";
import { ResumeSeance } from "@/components/coach/ResumeSeance";
import { dossierSeance, partagerCarnet } from "@/lib/dossier";
import { lireLettre } from "@/lib/lettre";
import { texteRetour, texteStructure } from "@/lib/retour";
import { extrait, minutesDeLecture, titrePropre } from "@/lib/textes";

export const metadata = { title: "Avant la séance" };

const SUIVIS = { a_voir: "pas ouvert", commence: "commencé", termine: "terminé" };
const dateReelle = (d: string | null) => (d && !avantOuverture(d) ? jourEtMois(d) : null);

function duree(sec: number | null) {
  if (!sec) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h}h${String(m).padStart(2, "0")}` : `${m} min`;
}

function dansCombien(d: string) {
  const jours = Math.round((new Date(d.slice(0, 10)).getTime() - new Date(new Date().toISOString().slice(0, 10)).getTime()) / 86_400_000);
  if (jours === 0) return "aujourd’hui";
  if (jours === 1) return "demain";
  if (jours > 1) return `dans ${jours} jours`;
  return null;
}

// Placement d'une carte sur ordinateur : colonnes (lignes de grille) et rangées.
// Avec « Ma préparation » (Cloé), la colonne 1 lui est réservée et tout se décale d'une colonne.
const place = (decalage: number, col: [number, number], ligne: string) =>
  ({ "--col": `${col[0] + decalage} / ${col[1] + decalage}`, "--ligne": ligne }) as React.CSSProperties;

const Vide = ({ children }: { children: React.ReactNode }) => <p className="m-0 text-[15px] text-violet/85">{children}</p>;

export default async function AvantLaSeance({ params }: PageProps<"/coach/clientes/[id]/seances/[seanceId]/avant">) {
  const profil = await exigerEquipe();
  const { id, seanceId } = await params;
  const estCoach = profil.role === "coach";
  const d = await chargerAvant(seanceId, estCoach);
  if (!d || d.cliente.id !== id) notFound();
  const { seance, cliente, precedente, meteos, etats, lettre, exercices, retours, affectations, suivis, ressources, preparation, preparationModifiee, audioPrecedente } = d;
  const p = cliente.prenom;
  const carnet = partagerCarnet(d);
  const texte = precedente ? texteSeance(precedente) : "";
  const libelle = (code: string) => etats.find((x) => x.code === code)?.libelle ?? code;
  const lue = lettre ? lireLettre(lettre.contenu || lettre.intro) : null;
  const retour = retours.find((r) => r.contenu.trim()) ?? null;
  const exercicesEcrits = exercices.filter((e) => carnet.sousExercice(e.id).length > 0).length;
  const motsPrecedente = precedente ? (precedente.mots_cles.length ? precedente.mots_cles : precedente.mots_proposes) : [];
  const depuis = precedente?.date && !avantOuverture(precedente.date) ? jourEtMoisCourt(precedente.date) : null;
  const o = estCoach ? 1 : 0;
  const resume = precedente ? (await resumesDe([precedente.id])).get(precedente.id) : undefined;
  // Les phrases épinglées pour cette séance, ou depuis la séance précédente sans séance précise.
  const epingles = (await epinglesDe(d.parcours.id)).filter((e) => e.seance_id === seance.id || (!e.seance_id && (!precedente?.date || e.created_at >= precedente.date)));
  // Les remarques d'Émilien sous les exercices de la lettre (planche trois-voix), rattachées à la séance de la lettre.
  const seanceLettre = lettre?.seance_id ?? precedente?.id ?? null;
  const remarques = seanceLettre ? (await echangesDe([seanceLettre])).filter((e) => e.pratique_id) : [];
  const NOMS_SOURCE = { transcript: "transcript", carnet: "carnet", retour: "retour d’Émilien", lettre: "lettre" } as const;

  // Les textes longs de la séance, dans la liseuse : onglets et « Suivant ».
  const textes: TexteLiseuse[] = [];
  if (retour && precedente) {
    const t = texteRetour(retour);
    textes.push({
      cle: "emilien",
      source: "retour",
      onglet: "Retour d’Émilien",
      annonce: "le retour d’Émilien",
      titre: `Séance ${precedente.numero} de ${p}`,
      meta: ["Émilien", retour.envoye_at ? jourEtMois(retour.envoye_at) : null, `${minutesDeLecture(t)} min de lecture`].filter(Boolean).join(" · "),
      contenu: (
        <>
          <TexteLecture>{t}</TexteLecture>
          {retour.contenu_lisible ? <TexteOrigine texte={retour.contenu} /> : null}
        </>
      ),
    });
  }
  if (texte && precedente) {
    textes.push({
      cle: "transcript",
      source: "transcript",
      onglet: "Transcript",
      annonce: "le transcript",
      titre: `Séance ${precedente.numero} de ${p}`,
      meta: ["Le transcript", dateReelle(precedente.date), `${minutesDeLecture(texte)} min de lecture`].filter(Boolean).join(" · "),
      contenu: <TexteLecture>{texteStructure(texte)}</TexteLecture>,
    });
  }
  if (lettre && lue) {
    textes.push({
      cle: "lettre",
      source: "lettre",
      onglet: "Lettre",
      annonce: "la lettre",
      titre: titrePropre(lettre.titre),
      meta: [dateReelle(lettre.publiee_at) ? `envoyée le ${dateReelle(lettre.publiee_at)}` : null, carnet.rienSousLettre ? "elle n’a rien écrit sous cette lettre" : `${p} a écrit sous ${exercicesEcrits} exercice${exercicesEcrits > 1 ? "s" : ""} sur ${exercices.length}`].filter(Boolean).join(" · "),
      contenu: (
        <div className="flex flex-col gap-7">
          {lue.preambule.trim() ? <TexteLecture>{lue.preambule}</TexteLecture> : null}
          {lue.chapitres.map((c) => {
            const ex = exercices.find((e) => e.slug === c.slug);
            const notes = ex ? carnet.sousExercice(ex.id) : [];
            return (
              <section key={c.slug} className="flex flex-col gap-3">
                {c.titre.trim() ? <h2 className="m-0 font-titre text-[22px] font-semibold leading-[1.1] text-violet">{c.titre}</h2> : null}
                <TexteLecture>{c.texte}</TexteLecture>
                {notes.length ? notes.map((n) => <VoixCliente key={n.id} prenom={p} date={dateReelle(n.date)} texte={n.contenu} />) : ex ? <Vide>Rien d’écrit sous cet exercice.</Vide> : null}
                {ex && seanceLettre ? <FilEchanges seanceId={seanceLettre} pratiqueId={ex.id} messages={remarques.filter((m) => m.pratique_id === ex.id)} invite="Une remarque sur cet exercice, pour l’équipe…" etiquette="pour l’équipe" /> : null}
              </section>
            );
          })}
          {carnet.finDeLettre.length ? (
            <section className="flex flex-col gap-3">
              <h2 className="m-0 font-titre text-[18px] font-semibold text-violet">En fin de lettre</h2>
              {carnet.finDeLettre.map((n) => (
                <VoixCliente key={n.id} prenom={p} date={dateReelle(n.date)} texte={n.contenu} />
              ))}
            </section>
          ) : null}
        </div>
      ),
    });
  }
  if (carnet.reste.length) {
    textes.push({
      cle: "carnet",
      source: "carnet",
      onglet: "Carnet",
      annonce: "son carnet",
      titre: `Le carnet de ${p}`,
      meta: `${carnet.reste.length} entrée${carnet.reste.length > 1 ? "s" : ""}${depuis ? ` depuis le ${depuis}` : ""}`,
      contenu: (
        <div className="flex flex-col gap-4">
          {carnet.reste.map((e) => (
            <VoixCliente key={e.id} prenom={p} date={dateReelle(e.date)} texte={e.contenu} />
          ))}
        </div>
      ),
    });
  }
  if (estCoach && preparation.trim()) {
    textes.push({
      cle: "prepa",
      onglet: "Prépa",
      annonce: "ta préparation",
      titre: `Ma préparation, séance ${seance.numero}`,
      meta: "toi seule",
      contenu: <TexteLecture>{preparation}</TexteLecture>,
    });
  }
  const aTexte = (cle: string) => textes.some((t) => t.cle === cle);

  const sections = [
    ...(estCoach ? [{ id: "prepa", libelle: "Prépa" }] : []),
    { id: "aborder", libelle: carnet.aAborder.length ? `Aborder · ${carnet.aAborder.length}` : "Aborder" },
    ...(lettre ? [{ id: "lettre", libelle: exercicesEcrits ? `Lettre · ${exercicesEcrits}` : "Lettre" }] : []),
    ...(precedente ? [{ id: "emilien", libelle: "Émilien" }] : []),
    { id: "carnet", libelle: "Carnet" },
    ...(precedente ? [{ id: "transcript", libelle: "Transcript" }] : []),
  ];

  const pleineLargeur = { "--col": "1 / -1", "--ligne": "1" } as React.CSSProperties;
  const actions = (className: string) => (
    <div className={`flex-wrap items-start gap-3 lg:justify-end lg:self-center ${className}`} style={pleineLargeur}>
      {estCoach ? <CopierDossier dossier={dossierSeance(d)} fantome /> : null}
      {estCoach ? <ModeEnSeance href={`/coach/clientes/${id}/seances/${seance.id}/en-seance`} /> : null}
    </div>
  );

  return (
    <PageCoach>
      <Barre retour={{ href: estCoach ? "/coach" : "/emilien", libelle: estCoach ? "Agenda" : "À lire" }} cliente={p} />
      <Sections sections={sections} className="lg:hidden" />
      <Liseuse textes={textes} epingle={{ parcoursId: d.parcours.id, seanceId: seance.id }}>
        <div className="mx-auto w-full max-w-3xl px-[22px] pb-16 pt-[22px] lg:max-w-[1180px] lg:px-10 lg:pt-9">
          <div className="grille-avant" style={{ "--colonnes": estCoach ? "380px repeat(12, minmax(0, 1fr))" : "repeat(12, minmax(0, 1fr))" } as React.CSSProperties}>
            <header className="flex items-center gap-3.5" style={pleineLargeur}>
              {seance.date ? <Calendrier date={seance.date} surPapier retard /> : null}
              <div className="flex flex-col gap-1">
                <h1 className="m-0 font-titre text-[28px] font-semibold leading-none tracking-[-0.03em] text-violet lg:text-[44px]">
                  {p} · séance {seance.numero}
                </h1>
                <p className="m-0 text-[14px] text-violet/85">{seance.date ? [jourEtHeure(seance.date), dansCombien(seance.date)].filter(Boolean).join(" · ") : "pas encore datée"}</p>
              </div>
            </header>
            {actions("hidden lg:flex")}

            {estCoach ? (
              <section id="prepa" className="ancre carte carte-papier lg:sticky lg:top-5" style={place(0, [1, 2], "2 / 6")}>
                <div aria-hidden className="h-1 bg-rouge" />
                <div className="px-[18px] pb-5 pt-4">
                  <Preparation seanceId={seance.id} initial={preparation} date={preparationModifiee ? jourEtMois(preparationModifiee) : null} />
                </div>
              </section>
            ) : null}

            <section id="aborder" className="ancre flex flex-col gap-2.5" style={place(o, [1, 13], "2")}>
              {carnet.aAborder.length ? (
                <>
                  <h2 className="m-0 flex items-baseline gap-2.5">
                    <span className="font-titre text-[44px] font-semibold leading-[0.9] tracking-[-0.03em] text-rouge">{carnet.aAborder.length}</span>
                    <span className="font-titre text-[22px] font-semibold tracking-[-0.02em] text-violet">{carnet.aAborder.length > 1 ? "choses qu’elle veut aborder" : "chose qu’elle veut aborder"}</span>
                  </h2>
                  {carnet.aAborder.map((e) => (
                    <VoixCliente key={e.id} prenom={p} date={dateReelle(e.date)} texte={e.contenu} nouveau={estCoach && e.vu_par_coach_at === null} />
                  ))}
                </>
              ) : (
                <Vide>Rien de marqué « à aborder » dans son carnet.</Vide>
              )}
              {epingles.length ? (
                <div className="flex flex-col gap-2 pt-2">
                  <h3 className="surtitre m-0 text-violet">Épinglé · {epingles.length} phrase{epingles.length > 1 ? "s" : ""}</h3>
                  {epingles.map((e) => (
                    <div key={e.id} className="carte-blanche flex items-start gap-3 rounded-l-none border-l-[3px] border-l-violet px-3.5 py-2.5">
                      <p className="m-0 flex-1 text-[15px] leading-[1.55]">
                        « {e.texte} » <span className="text-[14px] text-violet">· {NOMS_SOURCE[e.source]}</span>
                      </p>
                      <form action={retirerEpingle}>
                        <input type="hidden" name="id" value={e.id} />
                        <button type="submit" className="outil min-h-[44px]">
                          retirer
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            {lettre ? (
              <section id="lettre" className="ancre carte carte-papier" style={place(o, [1, 7], "3 / 5")}>
                <div className="flex flex-col gap-1 bg-violet px-[18px] pb-3 pt-3.5">
                  <h2 className="surtitre m-0 text-rose">La lettre</h2>
                  <p className="m-0 font-titre text-[22px] font-semibold leading-none tracking-[-0.02em] text-creme">{titrePropre(lettre.titre)}</p>
                  <p className="m-0 text-[14px] text-creme/80">
                    {[dateReelle(lettre.publiee_at) ? `envoyée le ${dateReelle(lettre.publiee_at)}` : null, exercices.length ? (exercicesEcrits ? `elle a écrit sous ${exercicesEcrits} exercice${exercicesEcrits > 1 ? "s" : ""} sur ${exercices.length}` : "elle n’a rien écrit sous les exercices") : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <ol className="m-0 flex list-none flex-col px-[18px] pb-1.5 pt-1">
                  {exercices.map((e, i) => {
                    const notes = carnet.sousExercice(e.id);
                    return (
                      <li key={e.id} className="flex gap-2.5 border-t border-[var(--filet-papier)] py-3 first:border-t-0">
                        <span aria-hidden className={`mt-1 size-3 shrink-0 rounded-full border-[1.5px] ${notes.length ? "border-rouge bg-rose" : "border-violet/40"}`} />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <span className="font-titre text-[17px] font-semibold leading-[1.1]">
                            {i + 1}. {titrePropre(e.titre)}
                          </span>
                          {notes.length ? (
                            <span className="rounded-r-[6px] border-l-[3px] border-rose bg-beige px-2.5 py-2 text-[15px] leading-[1.5]"><span className="line-clamp-2">{extrait(notes[0].contenu, 110)}</span></span>
                          ) : (
                            <span className="text-[14px] text-violet/85">rien écrit</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                  {carnet.finDeLettre.length ? (
                    <li className="flex gap-2.5 border-t border-[var(--filet-papier)] py-3">
                      <span aria-hidden className="mt-1 size-3 shrink-0 rounded-full border-[1.5px] border-rouge bg-rose" />
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="font-titre text-[17px] font-semibold leading-[1.1]">En fin de lettre</span>
                        <span className="line-clamp-2 rounded-r-[6px] border-l-[3px] border-rose bg-beige px-2.5 py-2 text-[15px] leading-[1.5]">{extrait(carnet.finDeLettre[0].contenu, 120)}</span>
                      </div>
                    </li>
                  ) : null}
                </ol>
                {aTexte("lettre") ? (
                  <OuvrirLecture cle="lettre" className="px-[18px] pb-2 text-violet">
                    Ouvrir la lettre et ses notes →
                  </OuvrirLecture>
                ) : null}
              </section>
            ) : null}

            {precedente ? (
              <section id="emilien" className="ancre carte bg-violet-nuit text-creme" style={place(o, lettre ? [7, 13] : [1, 7], "3")}>
                <div className="flex flex-col gap-3 px-[18px] pb-4 pt-[18px]">
                  <div className="flex items-center gap-2.5">
                    <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-rose font-titre text-[16px] font-bold text-violet-nuit">
                      É
                    </span>
                    <div className="flex flex-col">
                      <h2 className="surtitre m-0 text-rose">Le retour d’Émilien</h2>
                      <span className="text-[14px] text-creme/80">
                        séance {precedente.numero}
                        {retour?.envoye_at ? ` · ${jourEtMois(retour.envoye_at)}` : ""}
                      </span>
                    </div>
                  </div>
                  {retour ? (
                    <>
                      <PhraseCle
                        retourId={retour.id}
                        disponible={"phrase_cle" in retour}
                        phrase={retour.phrase_cle ?? null}
                        points={retour.points_cles ?? []}
                        phraseProposee={retour.phrase_cle_proposee ?? null}
                        pointsProposes={retour.points_cles_proposes ?? []}
                        apercu={extrait(texteRetour(retour), 260)}
                      />
                      <OuvrirLecture cle="emilien" className="text-rose">
                        Lire en entier · {minutesDeLecture(texteRetour(retour))} min →
                      </OuvrirLecture>
                    </>
                  ) : (
                    <p className="m-0 text-[15px] text-creme/85">Pas encore de retour pour cette séance.</p>
                  )}
                </div>
              </section>
            ) : null}

            <section className="demi carte carte-papier gap-3 px-4 pb-4 pt-3.5" style={place(o, [1, 5], "5")}>
              <h2 className="surtitre m-0 text-violet">Ses météos</h2>
              {meteos.length ? (
                <ul className="m-0 flex list-none flex-wrap items-end gap-2 p-0">
                  {meteos.slice(0, 4).map((m, i) => (
                    <li key={m.id} className="flex flex-col items-start gap-[3px]">
                      <span className={`rounded-full font-titre ${i === 0 ? "bg-rose px-3.5 pb-2 pt-2.5 text-[17px] font-semibold text-violet-nuit" : "border border-violet/35 px-[11px] pb-[5px] pt-[7px] text-[14px] font-medium text-violet"}`}>{libelle(m.etat_code)}</span>
                      <span className="pl-1 text-[14px] text-violet">{jourEtMoisCourt(m.date)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Vide>Aucune météo.</Vide>
              )}
            </section>

            <section id="carnet" className="ancre demi carte gap-1 bg-rose px-4 pb-3 pt-3.5 text-violet-nuit" style={place(o, [5, 8], "5")}>
              <h2 className="surtitre m-0">Le reste du carnet</h2>
              <div className="flex items-baseline gap-2.5">
                <span className="font-titre text-[52px] font-semibold leading-[0.9] tracking-[-0.03em]">{carnet.reste.length}</span>
                <span className="text-[14px] leading-[1.4]">
                  {carnet.reste.length > 1 ? "entrées" : "entrée"}
                  {depuis ? ` depuis le ${depuis}` : ""}
                  {carnet.reste[0] ? (
                    <>
                      <br />« {extrait(carnet.reste[0].contenu, 40)} »
                    </>
                  ) : null}
                </span>
              </div>
              {aTexte("carnet") ? <OuvrirLecture cle="carnet">Lire →</OuvrirLecture> : null}
            </section>

            <section className="carte carte-papier gap-3 px-4 pb-4 pt-3.5" style={place(o, [8, 13], "5")}>
              <h2 className="surtitre m-0 text-violet">Ses ressources</h2>
              {affectations.length ? (
                <ul className="m-0 grid list-none grid-cols-3 gap-2.5 p-0">
                  {affectations.slice(0, 6).map((a) => {
                    const r = ressources.find((x) => x.id === a.ressource_id);
                    const s = suivis.find((x) => x.affectation_id === a.id)?.statut ?? "a_voir";
                    if (!r) return null;
                    return (
                      <li key={a.id} className="flex min-w-0 flex-col gap-1.5">
                        {r.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image_url} alt="" className={`block h-[70px] w-full rounded-[6px] object-cover ${s === "a_voir" ? "opacity-45" : ""}`} />
                        ) : (
                          <span aria-hidden className={`block h-[70px] w-full rounded-[6px] bg-beige ${s === "a_voir" ? "opacity-45" : ""}`} />
                        )}
                        <span className="line-clamp-2 font-titre text-[14px] font-semibold leading-[1.1]">{titrePropre(r.titre)}</span>
                        <span className={`text-[14px] ${s === "a_voir" ? "text-violet/70" : "font-medium text-violet"}`}>{SUIVIS[s]}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Vide>Aucune ressource partagée.</Vide>
              )}
            </section>

            {precedente ? (
              <section id="transcript" className="ancre carte carte-papier gap-3 px-4 pb-3 pt-3.5" style={place(o, lettre ? [7, 13] : [7, 13], lettre ? "4" : "3")}>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="surtitre m-0 text-violet">Séance {precedente.numero} · le transcript</h2>
                  <span className="shrink-0 text-[14px] text-violet">{[dateReelle(precedente.date) && jourEtMoisCourt(precedente.date!), duree(precedente.audio_duree_sec)].filter(Boolean).join(" · ")}</span>
                </div>
                {precedente ? <ResumeSeance seanceId={precedente.id} resume={resume?.resume ?? null} propose={resume?.resume_propose ?? null} estCoach={estCoach} /> : null}
                {audioPrecedente ? <PetitLecteur src={audioPrecedente} titre={`la séance ${precedente.numero}`} /> : null}
                {motsPrecedente.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {motsPrecedente.map((m) => (
                      <span key={m} className="mot-sortie">
                        {m}
                      </span>
                    ))}
                  </div>
                ) : null}
                {texte ? (
                  <OuvrirLecture cle="transcript" className="text-violet">
                    Lire le transcript · {minutesDeLecture(texte)} min →
                  </OuvrirLecture>
                ) : (
                  <Vide>Pas encore de texte pour cette séance.</Vide>
                )}
              </section>
            ) : null}

            {actions("flex lg:hidden")}
          </div>
        </div>
      </Liseuse>
    </PageCoach>
  );
}
