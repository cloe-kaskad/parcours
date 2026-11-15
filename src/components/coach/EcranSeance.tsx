"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { enregistrerNotesSeance } from "@/lib/actions/seances";
import { ecrireNotes, heureCourte, lireNotes, type NoteSeance } from "@/lib/notes-seance";
import { empreinte, minutesALire, NOM_INTEGRAL, type SectionSeance } from "@/lib/version-seance";

// Le mode en séance (brief du 15 novembre 2026, maquette design/ecrans/mode-en-seance-desktop.dc.html).
// Ordinateur : repère à gauche, préparation au centre, notes à droite. Téléphone : préparation pleine
// largeur, notes dans un volet en bas. « Version séance » par défaut quand elle existe.

type Mode = "seance" | "complete";

// Les bandeaux, dans l'ordre des sections ; la dernière en beige.
const BANDEAUX = [
  { fond: "#E6361D", texte: "#F5EDE3" },
  { fond: "#59114D", texte: "#F5EDE3" },
  { fond: "#F7BECA", texte: "#3D0A34" },
  { fond: "#3D0A34", texte: "#F5EDE3" },
];
const DERNIER = { fond: "#E8DDD0", texte: "#59114D" };
const bandeau = (i: number, n: number) => (i === n - 1 && n > 1 ? DERNIER : BANDEAUX[i % BANDEAUX.length]);

const horloge = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");

// Le texte brut d'un nœud Markdown, pour reconnaître une question posée à la cliente.
type Noeud = { type?: string; value?: string; children?: Noeud[] };
const texteDe = (n: Noeud | undefined): string => (!n ? "" : n.type === "text" ? (n.value ?? "") : (n.children ?? []).map(texteDe).join(""));
const QUESTION = /^\s*[«"“][\s\S]*\?\s*[»"”]?\s*$/;

const COMPOSANTS: Components = {
  p: ({ children, node }) => {
    const t = texteDe(node as Noeud);
    return QUESTION.test(t) && t.length < 400 ? (
      <p className="m-0 border-l-4 border-rouge py-1 pl-4 font-titre text-[21px] font-semibold leading-[1.2] tracking-[-0.01em] text-violet lg:text-[23px]">{children}</p>
    ) : (
      <p className="m-0">{children}</p>
    );
  },
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  h1: ({ children }) => <h3 className="m-0 font-titre text-[21px] font-semibold leading-[1.15] text-violet">{children}</h3>,
  h2: ({ children }) => <h3 className="m-0 font-titre text-[21px] font-semibold leading-[1.15] text-violet">{children}</h3>,
  h3: ({ children }) => <h3 className="m-0 font-titre text-[21px] font-semibold leading-[1.15] text-violet">{children}</h3>,
  h4: ({ children }) => <h4 className="m-0 font-titre text-[19px] font-semibold leading-[1.2] text-violet">{children}</h4>,
  ul: ({ children }) => <ul className="m-0 flex list-disc flex-col gap-1.5 pl-[22px]">{children}</ul>,
  ol: ({ children }) => <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-[22px]">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="m-0 flex flex-col gap-3 border-l-[3px] border-rose pl-4 text-encre/85">{children}</blockquote>,
  hr: () => <hr className="my-1 w-16 border-[var(--filet-papier-fort)]" />,
};

// Un texte à lire mot pour mot : les retours à la ligne gardés à l'affichage.
const avecRetours = (t: string) => t.replace(/([^\n])\n(?!\n)/g, "$1  \n");

type ALire = { cle: string; texte: string; markdown: boolean };

export function EcranSeance({
  seanceId,
  entete,
  quitter,
  avant,
  version,
  complete,
  aChange,
  aAborder,
  notesInitiales,
}: {
  seanceId: string;
  entete: string;
  quitter: string;
  avant: string;
  version: SectionSeance[] | null;
  complete: SectionSeance[];
  aChange: boolean;
  aAborder: { id: string; contenu: string }[];
  notesInitiales: string;
}) {
  const [mode, setMode] = useState<Mode>(version?.length ? "seance" : "complete");
  const [secondes, setSecondes] = useState(0);
  const [faits, setFaits] = useState<Record<string, string>>({});
  const [enCours, setEnCours] = useState<Record<Mode, number | null>>({ seance: null, complete: null });
  const [lire, setLire] = useState<ALire | null>(null);
  const memoire = `seance-${seanceId}`;

  // Le chronomètre part à la première ouverture et tient si la page se recharge.
  useEffect(() => {
    let debut = Date.now();
    try {
      const garde = Number(sessionStorage.getItem(`${memoire}-debut`));
      if (garde && Date.now() - garde < 6 * 3600 * 1000) debut = garde;
      else sessionStorage.setItem(`${memoire}-debut`, String(debut));
      // Les sections déjà faites (page rechargée pendant la séance), relues après l'affichage.
      const f = sessionStorage.getItem(`${memoire}-faits`);
      if (f) setTimeout(() => setFaits(JSON.parse(f)), 0);
    } catch {}
    const tic = () => setSecondes(Math.floor((Date.now() - debut) / 1000));
    tic();
    const t = setInterval(tic, 1000);
    return () => clearInterval(t);
  }, [memoire]);

  const sections = mode === "seance" && version ? version : complete;
  const cleSection = (i: number) => `${mode}:${i}`;
  const premiereAFaire = sections.findIndex((_, i) => !faits[cleSection(i)]);
  const courante = enCours[mode] !== null && !faits[cleSection(enCours[mode]!)] ? enCours[mode]! : premiereAFaire;

  const marquer = (i: number) => {
    const cle = cleSection(i);
    const suivants = { ...faits };
    if (suivants[cle]) delete suivants[cle];
    else suivants[cle] = heureCourte(horloge(secondes));
    setFaits(suivants);
    setEnCours((e) => ({ ...e, [mode]: null }));
    try {
      sessionStorage.setItem(`${memoire}-faits`, JSON.stringify(suivants));
    } catch {}
  };

  const aller = (i: number) => {
    setEnCours((e) => ({ ...e, [mode]: i }));
    document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sectionCourante = courante >= 0 ? sections[courante]?.titre ?? "" : "";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-papier text-encre">
      <header className="sticky top-0 z-30 border-b border-carte-filet bg-papier">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 lg:h-[60px] lg:flex-nowrap lg:px-10 lg:py-0">
          <span className="order-1 font-titre text-[16px] font-semibold text-violet lg:text-[17px]">{entete}</span>
          <div className="order-3 flex items-center gap-2 lg:order-2" role="group" aria-label="Ce que tu lis">
            <Bascule actif={mode === "seance"} desactive={!version?.length} onClick={() => setMode("seance")}>
              Version séance
            </Bascule>
            <Bascule actif={mode === "complete"} onClick={() => setMode("complete")}>
              Préparation complète
            </Bascule>
          </div>
          <div className="order-2 flex items-center gap-5 lg:order-3 lg:gap-6">
            <span className="font-titre text-[20px] font-semibold tabular-nums text-violet lg:text-[24px]" aria-label="Temps de séance">
              {horloge(secondes)}
            </span>
            <Link href={quitter} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-violet">
              Quitter
            </Link>
          </div>
          <span className="order-4 w-full lg:hidden" />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1280px] gap-6 px-4 pb-[150px] pt-5 lg:grid-cols-[150px_minmax(0,1fr)_300px] lg:items-start lg:gap-9 lg:px-[30px] lg:pb-16 lg:pt-7">
        <nav aria-label="Le fil de la séance" className="sticky top-[84px] hidden flex-col lg:flex">
          {sections.map((s, i) => {
            const fait = !!faits[cleSection(i)];
            const b = bandeau(i, sections.length);
            return (
              <button key={i} type="button" onClick={() => aller(i)} aria-current={i === courante ? "step" : undefined} className="flex min-h-[44px] items-center gap-2.5 text-left font-titre text-[15px] font-semibold leading-[1.15] text-violet">
                <span aria-hidden className={`size-3 shrink-0 rounded-full ${i === courante ? "ring-2 ring-rouge ring-offset-2 ring-offset-papier" : ""}`} style={{ background: b.fond === "#E8DDD0" ? "#B9A99A" : b.fond, opacity: fait ? 0.4 : 1 }} />
                <span className={fait ? "line-through opacity-50" : i === courante ? "underline decoration-rouge decoration-2 underline-offset-4" : ""}>{s.titre}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex min-w-0 flex-col gap-4">
          {mode === "seance" && aChange ? (
            <p className="m-0 rounded-[8px] border border-rouge/40 bg-white px-4 py-2.5 text-[15px] text-violet">
              La préparation a changé depuis la version séance.{" "}
              <Link href={avant} className="font-titre font-semibold text-rouge underline underline-offset-4">
                Reproposer ?
              </Link>
            </p>
          ) : null}
          {mode === "complete" && !version?.length ? <p className="m-0 text-[14px] text-violet/85">Pas encore de version séance : la préparation complète, section par section.</p> : null}

          {aAborder.length ? (
            <div className="flex flex-wrap items-center gap-2.5 pb-1">
              <span className="font-titre text-[13px] font-bold tracking-[.08em] text-rouge">À ABORDER</span>
              {aAborder.map((e) => (
                <span key={e.id} className="rounded-r-[6px] border border-l-[3px] border-carte-filet border-l-rose bg-white px-3 py-2 text-[15px] leading-[1.3]">
                  {premiersMots(e.contenu)}
                </span>
              ))}
              <button type="button" onClick={() => setLire({ cle: "aborder", texte: aAborder.map((e) => e.contenu.trim()).join("\n\n---\n\n"), markdown: true })} className="outil min-h-[44px] text-[14px]">
                lire
              </button>
            </div>
          ) : null}

          {sections.length ? (
            sections.map((s, i) => {
              const b = bandeau(i, sections.length);
              const fait = faits[cleSection(i)];
              const courant = i === courante;
              return (
                <section
                  key={`${mode}-${i}`}
                  id={`section-${i}`}
                  className={`flex scroll-mt-[150px] flex-col overflow-hidden rounded-[12px] border border-carte-filet bg-white transition-[opacity,box-shadow] duration-300 lg:scroll-mt-[84px] ${fait ? "opacity-60" : ""}`}
                  style={courant ? { boxShadow: "0 0 0 3px rgba(230,54,29,.25)" } : undefined}
                >
                  <div className="flex items-center gap-3 px-4 py-3 lg:gap-3.5 lg:px-5" style={{ background: b.fond, color: b.texte }}>
                    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full pt-0.5 font-titre text-[15px] font-bold" style={{ background: b.texte, color: b.fond }}>
                      {fait ? "✓" : i + 1}
                    </span>
                    <button type="button" onClick={() => (fait ? marquer(i) : setEnCours((e) => ({ ...e, [mode]: i })))} className={`min-w-0 flex-1 text-left font-titre font-semibold leading-none tracking-[-0.02em] ${fait ? "text-[20px] lg:text-[22px]" : "text-[24px] lg:text-[30px]"}`}>
                      {s.titre}
                    </button>
                    <span className="hidden whitespace-nowrap text-[13px] sm:inline">{fait ? `fait · ${fait}` : s.duree}</span>
                    {fait ? (
                      <button type="button" onClick={() => marquer(i)} className="min-h-[36px] whitespace-nowrap px-1 font-titre text-[13px] font-semibold underline underline-offset-[3px]">
                        rouvrir
                      </button>
                    ) : (
                      <button type="button" onClick={() => marquer(i)} className="min-h-[36px] rounded-full border px-3 pb-[5px] pt-[7px] font-titre text-[14px] font-semibold" style={{ borderColor: b.texte, color: b.texte }}>
                        fait
                      </button>
                    )}
                  </div>
                  {!fait ? (
                    <div className="flex flex-col gap-3.5 px-4 pb-5 pt-4 text-[19px] leading-[1.55] lg:px-6 lg:pt-[18px]">
                      {s.duree ? <span className="text-[13px] text-violet/85 sm:hidden">{s.duree}</span> : null}
                      {s.blocs.length ? (
                        s.blocs.map((bl, j) =>
                          bl.type === "texte" ? (
                            <div key={j} className="flex flex-col gap-3.5 [overflow-wrap:anywhere]">
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPOSANTS}>
                                {bl.contenu}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <BlocALire key={j} titre={bl.titre} texte={bl.contenu} ouvrir={() => setLire({ cle: empreinte(bl.contenu), texte: bl.contenu, markdown: false })} />
                          ),
                        )
                      ) : (
                        <p className="m-0 text-[16px] text-violet/85">Rien d’écrit dans cette section.</p>
                      )}
                    </div>
                  ) : null}
                </section>
              );
            })
          ) : (
            <p className="m-0 rounded-[12px] border border-carte-filet bg-white px-5 py-4 text-[17px] text-violet">
              Pas de préparation pour cette séance.{" "}
              <Link href={avant} className="font-titre font-semibold text-rouge underline underline-offset-4">
                Écrire la préparation
              </Link>
            </p>
          )}
        </div>

        <Notes seanceId={seanceId} initiales={notesInitiales} heure={horloge(secondes)} section={sectionCourante} />
      </div>

      {lire ? <LirePleinePage texte={lire} fermer={() => setLire(null)} /> : null}
    </div>
  );
}

function premiersMots(t: string) {
  const mots = t.replace(/[#*_>`]/g, "").trim().split(/\s+/);
  return mots.length > 7 ? `${mots.slice(0, 7).join(" ")}…` : mots.join(" ");
}

function Bascule({ actif, desactive = false, onClick, children }: { actif: boolean; desactive?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      disabled={desactive}
      title={desactive ? "Pas encore de version séance : propose-la depuis « Avant la séance »." : undefined}
      onClick={onClick}
      className={`min-h-[40px] rounded-full border px-3.5 pb-[7px] pt-[9px] font-titre text-[14px] font-semibold disabled:opacity-40 ${actif ? "border-violet bg-violet text-creme" : "border-violet/35 text-violet"}`}
    >
      {children}
    </button>
  );
}

// Un texte à lire mot pour mot, replié sur une ligne à sa place dans la section.
function BlocALire({ titre, texte, ouvrir }: { titre: string; texte: string; ouvrir: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-r-[8px] border-l-4 border-violet-nuit bg-papier px-4 py-3">
      <span className="text-[16px] leading-[1.35] text-violet">
        <span className="font-titre text-[17px] font-semibold">{titre || NOM_INTEGRAL}</span> · {minutesALire(texte)} min à lire
        <span className="block text-[13px] text-violet/80">{NOM_INTEGRAL}, mot pour mot</span>
      </span>
      <button type="button" onClick={ouvrir} aria-label={`Ouvrir le texte à lire : ${titre || NOM_INTEGRAL}`} className="min-h-[44px] font-titre text-[16px] font-semibold text-rouge underline underline-offset-4">
        Ouvrir
      </button>
    </div>
  );
}

// Lire en pleine page : rien d'autre que le texte et « Fermer ». La position de lecture est gardée.
const positions = new Map<string, number>();
function LirePleinePage({ texte, fermer }: { texte: ALire; fermer: () => void }) {
  const zone = useRef<HTMLDivElement>(null);
  const declencheur = useRef<HTMLElement | null>(null);

  const quitter = useCallback(() => {
    if (zone.current) positions.set(texte.cle, zone.current.scrollTop);
    fermer();
    requestAnimationFrame(() => declencheur.current?.focus());
  }, [texte.cle, fermer]);

  useLayoutEffect(() => {
    declencheur.current = document.activeElement as HTMLElement | null;
    if (zone.current) zone.current.scrollTop = positions.get(texte.cle) ?? 0;
  }, [texte.cle]);

  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const touche = (e: KeyboardEvent) => e.key === "Escape" && quitter();
    window.addEventListener("keydown", touche);
    return () => {
      document.body.style.overflow = avant;
      window.removeEventListener("keydown", touche);
    };
  }, [quitter]);

  return (
    <div ref={zone} role="dialog" aria-modal="true" aria-label="Lire" className="fixed inset-0 z-50 overflow-y-auto bg-papier">
      <div className="sticky top-0 flex justify-end bg-papier/95 px-4 py-2 lg:px-8 lg:py-4">
        <button type="button" onClick={quitter} className="bouton-fantome !min-h-[44px] !py-2" autoFocus>
          Fermer
        </button>
      </div>
      <div className="mx-auto flex max-w-[36rem] flex-col gap-[1.1em] px-6 pb-24 pt-4 text-[20px] leading-[1.7] text-encre [overflow-wrap:anywhere] lg:pt-10">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <p className="m-0">{children}</p>, hr: () => <hr className="my-2 w-16 border-[var(--filet-papier-fort)]" /> }}>
          {texte.markdown ? texte.texte : avecRetours(texte.texte)}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// Les notes : chacune prend l'heure de séance et la section en cours. Entrée range, Maj+Entrée va à la ligne.
// Ordinateur : colonne de droite, fixe au défilement. Téléphone : volet en bas.
function Notes({ seanceId, initiales, heure, section }: { seanceId: string; initiales: string; heure: string; section: string }) {
  const [notes, setNotes] = useState<NoteSeance[]>(() => lireNotes(initiales));
  const [brouillon, setBrouillon] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [etat, setEtat] = useState("Chaque note prend l’heure et la section en cours.");
  const [, demarrer] = useTransition();
  const liste = useRef<HTMLDivElement>(null);

  useEffect(() => {
    liste.current?.scrollTo({ top: liste.current.scrollHeight });
  }, [notes.length, ouvert]);

  const ranger = () => {
    const texte = brouillon.trim();
    if (!texte) return;
    const suivantes = [...notes, { heure, section, texte }];
    setNotes(suivantes);
    setBrouillon("");
    setEtat("…");
    demarrer(async () => {
      const r = await enregistrerNotesSeance(seanceId, ecrireNotes(suivantes));
      setEtat(r.ok ? "Rangée dans la séance." : (r.message ?? "Pas enregistrée. Réessaie."));
    });
  };

  return (
    <aside aria-label="Notes" className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t border-carte-filet bg-papier px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_24px_rgba(20,0,16,.08)] lg:sticky lg:inset-auto lg:top-[84px] lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <span className="font-titre text-[13px] font-bold tracking-[.08em] text-violet">NOTES{notes.length ? ` · ${notes.length}` : ""}</span>
        <span role="status" className="min-w-0 flex-1 truncate text-[12px] text-violet lg:hidden">
          {etat === "Chaque note prend l’heure et la section en cours." ? `${heureCourte(heure)}${section ? ` · ${section}` : ""}` : etat}
        </span>
        <button type="button" onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert} className="outil min-h-[44px] text-[14px] lg:hidden">
          {ouvert ? "Replier" : "Voir les notes"}
        </button>
      </div>
      <div className="flex flex-col gap-3 rounded-[10px] border border-carte-filet bg-white px-3.5 py-2 lg:min-h-[420px] lg:px-4 lg:py-3.5">
        <div ref={liste} className={`${ouvert ? "flex" : "hidden"} max-h-[45dvh] flex-col gap-3 overflow-y-auto lg:flex lg:max-h-[calc(100dvh-300px)]`}>
          {notes.length ? (
            notes.map((n, i) => (
              <div key={i} className="text-[15px] leading-[1.5]">
                {n.heure ? (
                  <span className="block text-[12px] text-violet">
                    {heureCourte(n.heure)}
                    {n.section ? ` · ${n.section}` : ""}
                  </span>
                ) : null}
                <span className="whitespace-pre-line">{n.texte}</span>
              </div>
            ))
          ) : (
            <p className="m-0 text-[15px] text-violet/75">Aucune note pour l’instant.</p>
          )}
        </div>
        <label className="flex flex-col gap-1 border-carte-filet text-[15px] text-violet/75 lg:mt-auto lg:border-t lg:pt-2.5">
          <span className="hidden lg:inline">Écrire, Entrée pour ranger</span>
          <textarea
            value={brouillon}
            aria-label="Note pendant la séance"
            placeholder="Écrire, Entrée pour ranger"
            rows={1}
            onChange={(e) => setBrouillon(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                ranger();
              }
            }}
            className="block max-h-[30dvh] min-h-[44px] w-full resize-none bg-transparent py-2 text-[16px] leading-[1.5] text-encre outline-none [field-sizing:content] placeholder:text-violet/60 lg:min-h-[60px] lg:py-1 lg:placeholder:text-transparent"
          />
        </label>
      </div>
      <p role="status" className="m-0 hidden text-[12px] text-violet lg:block">
        {etat}
      </p>
    </aside>
  );
}
