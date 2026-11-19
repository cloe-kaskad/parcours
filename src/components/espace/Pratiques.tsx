"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { ecrireCarnet, marquerAAborder } from "@/lib/actions/cliente";
import { avantOuverture, jourEtMois } from "@/lib/dates";
import { TexteLettre } from "./TexteLettre";

// La page « Mes pratiques » (docs/09, section 3) : on lit, exercice par exercice.
// Rien n'est éditable à l'écran tant qu'elle n'a pas choisi d'écrire : « Prendre une note » ouvre une feuille à part.

export type Note = { id: string; date: string; contenu: string; aAborder: boolean };
export type Bloc =
  | { type: "exercice"; id: string; titre: string; bonus: boolean; texte: string; note: Note | null }
  | { type: "texte"; titre: string; texte: string };

type Feuille = { titre: string; pratiqueId?: string; note?: Note; aAborder: boolean };

const dateNote = (d: string) => (avantOuverture(d) ? null : jourEtMois(d));

export function Pratiques({
  serieId,
  titre,
  titreCourt,
  envoyee,
  seanceAVenir,
  motDeCloe,
  blocs,
  signature,
  notesLibres,
  avant,
  prochaineSeance,
}: {
  serieId: string;
  titre: string;
  titreCourt: string;
  envoyee: string | null;
  seanceAVenir: string | null;
  motDeCloe: string;
  blocs: Bloc[];
  signature: string | null;
  notesLibres: Note[];
  avant: { id: string; titre: string; date: string | null }[];
  prochaineSeance: string | null;
}) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [feuille, setFeuille] = useState<Feuille | null>(null);
  const [titreVisible, setTitreVisible] = useState(true);
  const [suite, setSuite] = useState(false);
  const entete = useRef<HTMLHeadingElement>(null);
  const aPlacer = useRef<string | null>(null);
  const fermerFeuille = useCallback(() => setFeuille(null), []);

  const exercices = blocs.filter((b): b is Extract<Bloc, { type: "exercice" }> => b.type === "exercice");
  const numero = (id: string) => exercices.findIndex((e) => e.id === id) + 1;
  const motLong = motDeCloe.split("\n").filter((l) => l.trim()).length > 10 || motDeCloe.length > 900;

  // Le titre de la barre apparaît quand le grand titre est sorti de l'écran.
  useEffect(() => {
    const el = entete.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setTitreVisible(e.isIntersecting), { rootMargin: "-56px 0px 0px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Ouvrir un exercice referme le précédent et place son titre en haut de l'écran.
  useLayoutEffect(() => {
    if (!aPlacer.current) return;
    document.getElementById(`ex-${aPlacer.current}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    aPlacer.current = null;
  }, [ouvert]);

  const basculer = (id: string, placer = false) => {
    const suivant = ouvert === id ? null : id;
    if (suivant && (placer || ouvert)) aPlacer.current = suivant;
    setOuvert(suivant);
  };

  return (
    <>
      {/* Barre fixe : le retour est à un geste, à tout moment. */}
      <div className="sticky top-0 z-30 border-b border-[var(--filet-papier)] bg-papier/95 backdrop-blur-[2px]">
        <div className="mx-auto grid h-[52px] w-full max-w-[1040px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 md:px-8">
          <Link href="/espace" className="inline-flex min-h-[44px] items-center font-titre text-[16px] font-semibold text-violet">
            ← Mon espace
          </Link>
          <span aria-hidden={titreVisible} className={`truncate text-center font-titre text-[15px] font-semibold text-violet transition-opacity duration-200 ${titreVisible ? "opacity-0" : "opacity-100"}`}>
            {titreCourt}
          </span>
          <span className="w-[92px]" aria-hidden />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1040px] px-6 md:grid md:grid-cols-[200px_minmax(0,66ch)] md:justify-center md:gap-14 md:px-8">
        {/* Ordinateur : la liste des exercices reste visible à gauche, comme sommaire. */}
        <nav aria-label="Les exercices" className="sticky top-[76px] hidden self-start pt-[58px] md:flex md:flex-col">
          {exercices.map((e) => (
            <button key={e.id} type="button" onClick={() => basculer(e.id, true)} className={`flex min-h-[44px] items-center gap-2 py-1.5 text-left font-titre text-[15px] font-semibold leading-[1.15] ${ouvert === e.id ? "text-rouge" : "text-violet"}`}>
              <span className="w-5 shrink-0 tabular-nums">{numero(e.id)}.</span>
              <span>{e.titre}</span>
            </button>
          ))}
        </nav>

        <article className="flex min-w-0 flex-col">
          <header className="flex flex-col gap-2 pt-7 md:pt-12">
            <h1 ref={entete} className="t-page text-violet">
              {titre}
            </h1>
            <p className="text-[15px] leading-[1.5] text-violet">{[envoyee ? `envoyées le ${envoyee}` : null, seanceAVenir ? `notre séance : ${seanceAVenir}` : null].filter(Boolean).join(" · ")}</p>
          </header>

          {motDeCloe ? (
            <div className="pt-6">
              <div className={`relative ${motLong && !suite ? "max-h-[17rem] overflow-hidden" : ""}`}>
                <TexteLettre>{motDeCloe}</TexteLettre>
                {motLong && !suite ? <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-papier to-transparent" /> : null}
              </div>
              {motLong ? (
                <button type="button" onClick={() => setSuite(!suite)} className="t-action mt-2 min-h-[44px] text-[16px] text-rouge">
                  {suite ? "Replier" : "Lire la suite"}
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Le cœur de la page : les exercices, fermés. */}
          <div className="mt-7 flex flex-col border-t border-[var(--filet-papier-fort)]">
            {blocs.map((b, i) => {
              if (b.type === "texte") {
                return (
                  <section key={`t-${i}`} className="flex flex-col gap-3 border-b border-[var(--filet-papier)] py-6">
                    {b.titre ? <h2 className="font-titre text-[20px] font-semibold leading-[1.1] text-violet">{b.titre}</h2> : null}
                    <TexteLettre>{b.texte}</TexteLettre>
                  </section>
                );
              }
              const estOuvert = ouvert === b.id;
              const n = numero(b.id);
              const dernier = n === exercices.length;
              return (
                <section key={b.id} id={`ex-${b.id}`} className="scroll-mt-[60px] border-b border-[var(--filet-papier)]">
                  <h2 className="m-0">
                    <button type="button" aria-expanded={estOuvert} aria-controls={`corps-${b.id}`} onClick={() => basculer(b.id)} className="flex min-h-[64px] w-full items-center gap-3 py-3.5 text-left">
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full pt-0.5 font-titre text-[15px] font-bold ${estOuvert ? "bg-rouge text-creme" : "border border-violet/35 text-violet"}`}>{n}</span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        {b.bonus ? <span className="font-titre text-[13px] font-semibold tracking-[0.02em] text-rouge">Bonus</span> : null}
                        <span className="font-titre text-[20px] font-semibold leading-[1.1] text-encre md:text-[21px]">{b.titre}</span>
                      </span>
                      {b.note ? <span className="shrink-0 text-[14px] text-violet">tu as écrit</span> : null}
                      <span aria-hidden className={`shrink-0 font-titre text-[18px] text-violet transition-transform duration-200 ${estOuvert ? "rotate-90" : ""}`}>
                        ›
                      </span>
                    </button>
                  </h2>
                  {estOuvert ? (
                    <div id={`corps-${b.id}`} className="flex flex-col gap-[18px] pb-7 pt-1 motion-safe:animate-[apparition_.25s_ease-out]">
                      <TexteLettre>{b.texte}</TexteLettre>
                      {b.note ? <NoteEcrite note={b.note} modifier={() => setFeuille({ titre: b.titre, pratiqueId: b.id, note: b.note!, aAborder: b.note!.aAborder })} /> : null}
                      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 pt-1">
                        {!b.note ? (
                          <button type="button" onClick={() => setFeuille({ titre: b.titre, pratiqueId: b.id, aAborder: false })} className="bouton-rouge">
                            Prendre une note
                          </button>
                        ) : (
                          <span />
                        )}
                        {dernier ? (
                          <button type="button" onClick={() => basculer(b.id)} className="t-action min-h-[44px] text-[17px] text-violet">
                            Refermer
                          </button>
                        ) : (
                          <button type="button" onClick={() => basculer(exercices[n].id, true)} className="t-action min-h-[44px] text-[17px] text-rouge">
                            Exercice suivant →
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>

          {signature ? <p className="pt-10 font-italique text-[22px] italic text-violet">{signature}</p> : null}

          <section className="mt-12 flex flex-col gap-3 border-t border-violet/25 pt-[26px]">
            <h2 className="font-titre text-[24px] font-semibold leading-none tracking-[-0.02em] text-violet">Une question pour Cloé avant la séance</h2>
            <p className="text-[15px] leading-[1.6] text-violet">
              Une question, un doute, une chose que tu veux poser {prochaineSeance ? `avant le ${prochaineSeance}` : "avant la prochaine séance"}. Ça ira dans ton carnet, à aborder en séance.
            </p>
            {notesLibres.map((n) => (
              <NoteEcrite key={n.id} note={n} modifier={() => setFeuille({ titre: "Une question pour Cloé", note: n, aAborder: n.aAborder })} />
            ))}
            <button type="button" onClick={() => setFeuille({ titre: "Une question pour Cloé", aAborder: true })} className="bouton-fantome self-start">
              Écrire à Cloé
            </button>
          </section>

          {avant.length ? (
            <nav aria-label="Mes pratiques précédentes" className="mt-12 flex flex-col border-t border-violet/25 pb-[60px] pt-[26px]">
              <h2 className="pb-2 font-titre text-[20px] font-semibold text-violet">Mes pratiques précédentes</h2>
              {avant.map((l, i) => (
                <Link key={l.id} href={`/espace/pratiques/${l.id}`} className={`flex min-h-[48px] items-center justify-between gap-3 py-2.5 font-titre text-[17px] font-semibold text-violet ${i < avant.length - 1 ? "border-b border-[var(--filet-papier)]" : ""}`}>
                  <span>{l.titre}</span>
                  {l.date ? <span className="shrink-0 font-sans text-[14px] font-normal opacity-75">{l.date}</span> : null}
                </Link>
              ))}
            </nav>
          ) : (
            <div className="pb-[60px]" />
          )}
        </article>
      </div>

      {feuille ? <FeuilleEcriture serieId={serieId} feuille={feuille} fermer={fermerFeuille} /> : null}
    </>
  );
}

function NoteEcrite({ note, modifier }: { note: Note; modifier: () => void }) {
  const date = dateNote(note.date);
  return (
    <div className="carte-blanche flex flex-col gap-1.5 rounded-l-none border-l-[3px] border-l-rose px-[18px] py-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-titre text-[14px] font-semibold text-violet">
          Tu as écrit{date ? <span className="font-sans font-normal opacity-85"> · {date}</span> : null}
          {note.aAborder ? <span className="font-sans font-normal text-rouge"> · à aborder en séance</span> : null}
        </span>
        <button type="button" onClick={modifier} className="geste-etendu relative min-h-[44px] text-[14px] text-violet underline">
          modifier
        </button>
      </div>
      <p className="whitespace-pre-line text-[16px] leading-[1.6]">{note.contenu}</p>
    </div>
  );
}

// La feuille d'écriture : plein écran sur téléphone, fenêtre centrée sur ordinateur.
function FeuilleEcriture({ serieId, feuille, fermer }: { serieId: string; feuille: Feuille; fermer: () => void }) {
  const [texte, setTexte] = useState(feuille.note?.contenu ?? "");
  const [aborder, setAborder] = useState(feuille.aAborder);
  const [erreur, setErreur] = useState("");
  const [enCours, demarrer] = useTransition();
  const router = useRouter();
  const declencheur = useRef<HTMLElement | null>(null);

  useEffect(() => {
    declencheur.current = document.activeElement as HTMLElement | null;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const touche = (e: KeyboardEvent) => e.key === "Escape" && fermer();
    window.addEventListener("keydown", touche);
    return () => {
      document.body.style.overflow = avant;
      window.removeEventListener("keydown", touche);
      declencheur.current?.focus();
    };
  }, [fermer]);

  const enregistrer = () => {
    const fd = new FormData();
    fd.set("contenu", texte);
    fd.set("serie_id", serieId);
    if (feuille.note) fd.set("id", feuille.note.id);
    if (feuille.pratiqueId) fd.set("pratique_id", feuille.pratiqueId);
    if (aborder) fd.set("a_aborder", "on");
    demarrer(async () => {
      const r = await ecrireCarnet(fd);
      if (!r.ok) return setErreur(r.message);
      if (feuille.note && feuille.note.aAborder !== aborder) await marquerAAborder(feuille.note.id, aborder);
      router.refresh();
      fermer();
    });
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Écrire : ${feuille.titre}`} className="fixed inset-0 z-50 flex bg-papier md:items-center md:justify-center md:bg-violet-nuit/60 md:p-6">
      <div className="flex w-full flex-col bg-papier md:max-h-[86vh] md:max-w-[620px] md:rounded-[10px] md:shadow-[0_20px_60px_rgba(20,0,16,.35)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--filet-papier)] px-5 py-2.5">
          <p className="m-0 min-w-0 truncate font-titre text-[16px] font-semibold text-violet">{feuille.titre}</p>
          <button type="button" onClick={fermer} className="bouton-fantome shrink-0 !min-h-[44px] !py-2">
            Fermer
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
          <textarea
            autoFocus
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Écris ici, ça reste dans ton carnet. Cloé le lit avant la séance."
            aria-label="Ta note"
            className="min-h-[40vh] w-full flex-1 resize-none bg-transparent text-[17px] leading-[1.6] text-encre outline-none focus-visible:!outline-none placeholder:text-encre/45 md:min-h-[260px]"
          />
          {erreur ? (
            <p role="alert" className="m-0 text-[14px] text-rouge">
              {erreur}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--filet-papier)] pt-3">
            <button type="button" aria-pressed={aborder} onClick={() => setAborder(!aborder)} className={`min-h-[44px] font-titre text-[14px] font-semibold ${aborder ? "text-rouge" : "text-violet/55"}`}>
              ● à aborder en séance
            </button>
            <button type="button" onClick={enregistrer} disabled={enCours || !texte.trim()} className="bouton-rouge disabled:opacity-50">
              {enCours ? "Un instant…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
