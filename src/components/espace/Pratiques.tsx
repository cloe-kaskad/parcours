"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { ecrireCarnet, marquerAAborder } from "@/lib/actions/cliente";
import { avantOuverture, jourEtMois } from "@/lib/dates";
import { TexteLettre } from "./TexteLettre";

// « Mes pratiques » (maquettes B-v2-mes-pratiques, 19 novembre 2026) : on lit, exercice par exercice.
// Rien n'est éditable à l'écran : « Prendre une note » ouvre une feuille d'écriture par-dessus.

export type Note = { id: string; date: string; contenu: string; aAborder: boolean };
export type Exercice = { id: string; titre: string; bonus: boolean; description: string; texte: string; note: Note | null };

type Feuille = { cle: string; surtitre: string; titre: string; pratiqueId?: string; note?: Note; aAborder: boolean };

const dateNote = (d: string) => (avantOuverture(d) ? null : jourEtMois(d));
const QUESTION = "Une question pour Cloé avant la séance";

export function Pratiques({
  serieId,
  titre,
  titreCourt,
  dates,
  motDeCloe,
  exercices,
  motDeFin,
  signature,
  notesLibres,
  avant,
  prochaineSeance,
}: {
  serieId: string;
  titre: string;
  titreCourt: string;
  dates: string;
  motDeCloe: string;
  exercices: Exercice[];
  motDeFin: { titre: string; texte: string }[];
  signature: string | null;
  notesLibres: Note[];
  avant: { id: string; titre: string; date: string | null }[];
  prochaineSeance: string | null;
}) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [feuille, setFeuille] = useState<Feuille | null>(null);
  const aPlacer = useRef<string | null>(null);
  const fermerFeuille = useCallback(() => setFeuille(null), []);

  const nonBonus = exercices.filter((e) => !e.bonus);
  const bonus = exercices.length - nonBonus.length;
  const numero = (e: Exercice) => (e.bonus ? "+" : String(nonBonus.indexOf(e) + 1));

  // Un seul exercice ouvert ; « Exercice suivant » place le nouveau titre en haut de l'écran.
  useLayoutEffect(() => {
    if (!aPlacer.current) return;
    document.getElementById(`ex-${aPlacer.current}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    aPlacer.current = null;
  }, [ouvert]);

  const basculer = (id: string, placer = false) => {
    const suivant = ouvert === id ? null : id;
    if (suivant && placer) aPlacer.current = suivant;
    setOuvert(suivant);
  };

  const entete = (
    <header className="flex flex-col gap-2">
      <h1 className="font-titre text-[34px] font-semibold leading-[1] tracking-[-0.03em] text-violet md:text-[40px]">{titre}</h1>
      {dates ? <p className="text-[14px] leading-[1.45] text-violet">{dates}</p> : null}
    </header>
  );
  // Après la liste sur téléphone, à gauche sur ordinateur.
  const fin = (
    <>
      {motDeFin.map((b, i) => (
        <div key={i} className="flex flex-col gap-2">
          {b.titre ? <h2 className="font-titre text-[19px] font-semibold leading-[1.1] text-violet">{b.titre}</h2> : null}
          <TexteLettre>{b.texte}</TexteLettre>
        </div>
      ))}
      {signature ? <p className="font-italique text-[22px] italic text-violet">{signature}</p> : null}
      <div className="flex flex-col gap-2.5">
        {notesLibres.map((n) => (
          <NoteEcrite key={n.id} note={n} modifier={() => setFeuille({ cle: `note-${n.id}`, surtitre: "Ta question", titre: QUESTION, note: n, aAborder: n.aAborder })} />
        ))}
        <button
          type="button"
          onClick={() => setFeuille({ cle: `question-${serieId}`, surtitre: "Ta question", titre: QUESTION, aAborder: true })}
          className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[10px] border border-carte-filet bg-white px-4 py-3.5 text-center"
        >
          <span className="font-titre text-[15px] font-semibold text-encre">{QUESTION}</span>
          <span className="font-titre text-[15px] font-semibold text-rouge">Écrire</span>
          {prochaineSeance ? <span className="text-[13px] text-violet">avant le {prochaineSeance}, rangée dans ton carnet</span> : null}
        </button>
      </div>
      {avant.length ? (
        <details className="group">
          <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center text-[15px] text-violet underline underline-offset-4">Mes pratiques précédentes</summary>
          <nav aria-label="Mes pratiques précédentes" className="flex flex-col">
            {avant.map((l, i) => (
              <Link key={l.id} href={`/espace/pratiques/${l.id}`} className={`flex min-h-[48px] items-center justify-between gap-3 py-2 font-titre text-[16px] font-semibold text-violet ${i < avant.length - 1 ? "border-b border-[var(--filet-papier)]" : ""}`}>
                <span>{l.titre}</span>
                {l.date ? <span className="shrink-0 font-sans text-[13px] font-normal opacity-75">{l.date}</span> : null}
              </Link>
            ))}
          </nav>
        </details>
      ) : null}
    </>
  );

  return (
    <>
      {/* Barre fixe : le retour est à un geste, à tout moment. */}
      <div className="sticky top-0 z-30 border-b border-[var(--filet-papier)] bg-papier/95 backdrop-blur-[2px]">
        <div className="mx-auto flex h-[52px] w-full max-w-[1200px] items-center justify-between gap-3 px-5 md:px-10">
          <Link href="/espace" className="inline-flex min-h-[44px] shrink-0 items-center font-titre text-[16px] font-semibold text-violet">
            ← Mon espace
          </Link>
          <span className="min-w-0 truncate font-titre text-[14px] font-semibold text-violet/80 md:hidden">{titreCourt}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-violet.svg" alt="Blocages & Intuition" className="hidden h-[30px] w-auto md:block" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-5 pb-16 pt-6 md:grid md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:gap-[70px] md:px-10 md:pt-11">
        {/* Ordinateur : à gauche, fixe au défilement. */}
        <aside className="hidden md:sticky md:top-[76px] md:flex md:max-h-[calc(100dvh-96px)] md:flex-col md:gap-5 md:self-start md:overflow-y-auto md:pb-6 md:pr-1">
          {entete}
          {motDeCloe ? <MotDeCloe texte={motDeCloe} /> : null}
          {fin}
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="flex flex-col gap-5 md:hidden">
            {entete}
            {motDeCloe ? <MotDeCloe texte={motDeCloe} /> : null}
          </div>

          <div className="mt-7 flex flex-col gap-1 md:mt-0">
            <h2 className="font-titre text-[22px] font-semibold leading-none text-violet">
              {nonBonus.length > 1 ? `Tes ${nonBonus.length} exercices` : nonBonus.length === 1 ? "Ton exercice" : "Tes exercices"}
              {bonus ? <span className="font-sans text-[14px] font-normal"> {bonus > 1 ? `et ${bonus} bonus` : "et un bonus"}</span> : null}
            </h2>
            <p className="text-[14px] text-violet">Ouvre-les un par un, dans l’ordre que tu veux.</p>
          </div>

          <div className="mt-3.5 flex flex-col gap-2.5">
            {exercices.map((e, i) => {
              const estOuvert = ouvert === e.id;
              const suivant = exercices[i + 1];
              const surtitre = `Ta note · sous l’exercice ${numero(e)}`;
              return (
                <section key={e.id} id={`ex-${e.id}`} className={`scroll-mt-[64px] overflow-hidden rounded-[10px] border bg-white ${estOuvert ? "border-violet" : "border-carte-filet"}`}>
                  <h3 className="m-0">
                    <button
                      type="button"
                      aria-expanded={estOuvert}
                      aria-controls={`corps-${e.id}`}
                      onClick={() => basculer(e.id)}
                      className={`flex min-h-[72px] w-full items-center gap-3.5 px-4 py-3.5 text-left md:px-5 ${estOuvert ? "bg-violet" : ""}`}
                    >
                      <span className={`flex size-[34px] shrink-0 items-center justify-center rounded-full pt-0.5 font-titre text-[15px] font-bold ${estOuvert ? "bg-creme text-violet" : "bg-violet text-creme"}`}>{numero(e)}</span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className={`font-titre text-[19px] font-semibold leading-[1.15] ${estOuvert ? "text-creme" : "text-encre"}`}>{e.bonus && !/^bonus/i.test(e.titre) ? `Bonus : ${e.titre}` : e.titre}</span>
                        {!estOuvert && e.description ? <span className="line-clamp-1 text-[14px] text-violet">{e.description}</span> : null}
                        {!estOuvert && e.note ? <span className="text-[13px] font-semibold text-rouge">tu as écrit</span> : null}
                      </span>
                      <span className={`shrink-0 font-titre text-[14px] font-semibold ${estOuvert ? "text-rose" : "text-rouge"}`}>{estOuvert ? "Fermer ▴" : "Ouvrir ▾"}</span>
                    </button>
                  </h3>
                  {estOuvert ? (
                    <div id={`corps-${e.id}`} className="flex flex-col gap-[18px] px-4 pb-5 pt-5 motion-safe:animate-[apparition_.25s_ease-out] md:px-5">
                      <TexteLettre>{e.texte}</TexteLettre>
                      {e.note ? <NoteEcrite note={e.note} modifier={() => setFeuille({ cle: `note-${e.note!.id}`, surtitre, titre: e.titre, pratiqueId: e.id, note: e.note!, aAborder: e.note!.aAborder })} /> : null}
                      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-[var(--filet-papier)] pt-4">
                        <button type="button" onClick={() => setFeuille({ cle: `ex-${e.id}`, surtitre, titre: e.titre, pratiqueId: e.id, aAborder: false })} className="bouton-fantome">
                          Prendre une note
                        </button>
                        {suivant ? (
                          <button type="button" onClick={() => basculer(suivant.id, true)} className="t-action min-h-[44px] text-[16px] text-rouge">
                            Exercice suivant →
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col gap-6 md:hidden">{fin}</div>
        </div>
      </div>

      {feuille ? <FeuilleEcriture key={feuille.cle} serieId={serieId} feuille={feuille} fermer={fermerFeuille} /> : null}
    </>
  );
}

// Le mot de Cloé, replié au-delà de dix lignes.
function MotDeCloe({ texte }: { texte: string }) {
  const [suite, setSuite] = useState(false);
  const long = texte.split("\n").filter((l) => l.trim()).length > 10 || texte.length > 700;
  return (
    <div className="flex flex-col">
      <div className={`relative ${long && !suite ? "max-h-[15.5rem] overflow-hidden" : ""}`}>
        <TexteLettre>{texte}</TexteLettre>
        {long && !suite ? <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-papier to-transparent" /> : null}
      </div>
      {long ? (
        <button type="button" onClick={() => setSuite(!suite)} className="t-action min-h-[44px] self-start text-[15px] text-violet underline underline-offset-4">
          {suite ? "replier" : "lire la suite"}
        </button>
      ) : null}
    </div>
  );
}

function NoteEcrite({ note, modifier }: { note: Note; modifier: () => void }) {
  const date = dateNote(note.date);
  return (
    <div className="flex flex-col gap-1.5 rounded-r-[6px] border-l-[3px] border-rose bg-papier px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-titre text-[13px] font-semibold text-violet">
          Tu as écrit{date ? <span className="font-sans font-normal opacity-85"> · {date}</span> : null}
        </span>
        <button type="button" onClick={modifier} className="min-h-[44px] font-titre text-[14px] font-semibold text-violet underline underline-offset-[3px]">
          modifier
        </button>
      </div>
      <p className="whitespace-pre-line text-[16px] leading-[1.6]">{note.contenu}</p>
      {note.aAborder ? (
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-rose px-2.5 pb-[3px] pt-1 font-titre text-[12px] font-semibold text-violet-nuit">
          <span aria-hidden className="size-1.5 rounded-full bg-rouge" /> à aborder en séance
        </span>
      ) : null}
    </div>
  );
}

// Un brouillon survit à « Fermer » sans enregistrer, et au rechargement de la page.
const brouillons = new Map<string, string>();
function lireBrouillon(cle: string) {
  if (brouillons.has(cle)) return brouillons.get(cle)!;
  try {
    return sessionStorage.getItem(`brouillon-${cle}`);
  } catch {
    return null;
  }
}
function garderBrouillon(cle: string, texte: string | null) {
  if (texte === null) brouillons.delete(cle);
  else brouillons.set(cle, texte);
  try {
    if (texte === null) sessionStorage.removeItem(`brouillon-${cle}`);
    else sessionStorage.setItem(`brouillon-${cle}`, texte);
  } catch {}
}

// La feuille d'écriture : plein écran sur téléphone, fenêtre centrée sur ordinateur. Échap ferme.
function FeuilleEcriture({ serieId, feuille, fermer }: { serieId: string; feuille: Feuille; fermer: () => void }) {
  const [texte, setTexte] = useState(() => lireBrouillon(feuille.cle) ?? feuille.note?.contenu ?? "");
  const [aborder, setAborder] = useState(feuille.aAborder);
  const [erreur, setErreur] = useState("");
  const [enCours, demarrer] = useTransition();
  const router = useRouter();
  const [aujourdhui] = useState(() => jourEtMois(new Date().toISOString()));

  useEffect(() => {
    const declencheur = document.activeElement as HTMLElement | null;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermer();
    };
    window.addEventListener("keydown", touche);
    return () => {
      document.body.style.overflow = avant;
      window.removeEventListener("keydown", touche);
      declencheur?.focus();
    };
  }, [fermer]);

  const ecrire = (v: string) => {
    setTexte(v);
    garderBrouillon(feuille.cle, v === (feuille.note?.contenu ?? "") ? null : v);
  };

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
      garderBrouillon(feuille.cle, null);
      router.refresh();
      fermer();
    });
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`${feuille.surtitre} : ${feuille.titre}`} className="fixed inset-0 z-50 flex bg-papier md:items-start md:justify-center md:bg-violet-nuit/50 md:px-6 md:pt-[110px]">
      <div className="flex w-full flex-col bg-papier md:max-h-[80vh] md:max-w-[660px] md:rounded-[12px] md:shadow-[0_20px_60px_rgba(20,0,16,.35)]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--filet-papier)] px-5 py-3 md:border-0 md:px-[30px] md:pt-6">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="m-0 text-[13px] text-violet">{feuille.surtitre}</p>
            <p className="m-0 font-titre text-[22px] font-semibold leading-[1.1] text-violet md:text-[26px]">{feuille.titre}</p>
          </div>
          <button type="button" onClick={fermer} className="bouton-fantome shrink-0 !min-h-[44px] !py-2">
            Fermer
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 md:px-[30px] md:pb-6 md:pt-1">
          <p className="m-0 text-[13px] text-violet">{(feuille.note && dateNote(feuille.note.date)) || aujourdhui}</p>
          <textarea
            autoFocus
            value={texte}
            onChange={(e) => ecrire(e.target.value)}
            placeholder="Écris ici, ça reste dans ton carnet."
            aria-label="Ta note"
            className="min-h-[42vh] w-full flex-1 resize-none rounded-[8px] border border-carte-filet bg-white p-4 text-[17px] leading-[1.6] text-encre outline-none placeholder:text-encre/45 focus-visible:!outline-none md:min-h-[240px]"
          />
          {erreur ? (
            <p role="alert" className="m-0 text-[14px] text-rouge">
              {erreur}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex min-h-[44px] items-center gap-2.5 text-[16px] text-encre">
              <input type="checkbox" checked={aborder} onChange={(e) => setAborder(e.target.checked)} className="size-5 accent-rouge" />à aborder en séance
            </label>
            <button type="button" onClick={enregistrer} disabled={enCours || !texte.trim()} className="bouton-rouge disabled:opacity-50">
              {enCours ? "Un instant…" : "Enregistrer"}
            </button>
          </div>
          <p className="m-0 text-[13px] text-violet">Je lis tout avant notre séance.</p>
        </div>
      </div>
    </div>
  );
}
