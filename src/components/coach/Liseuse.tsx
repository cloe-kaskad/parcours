"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

// La liseuse : les textes longs d'une même séance (retour d'Émilien, transcript, lettre, préparation…)
// s'ouvrent en grand, par-dessus la page, avec des onglets pour passer de l'un à l'autre
// et « Suivant » en bas. Chaque texte garde sa position de lecture. Échap ou « Fermer » referme.
// Sur téléphone, c'est une page plein écran ; sur ordinateur, une feuille sur fond violet nuit.
export type TexteLiseuse = {
  cle: string;
  // Le nom de l'onglet (« Retour d'Émilien ») et la façon de l'annoncer dans « Suivant : le transcript ».
  onglet: string;
  annonce: string;
  titre: string;
  meta?: string;
  contenu: React.ReactNode;
};

const Ouvrir = createContext<(cle: string) => void>(() => {});

// Temps de lecture, à 200 mots par minute.
export function minutesDeLecture(texte: string) {
  const mots = texte.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  return Math.max(1, Math.round(mots / 200));
}

export function Liseuse({ textes, children }: { textes: TexteLiseuse[]; children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const zone = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, number>());
  const declencheur = useRef<HTMLElement | null>(null);

  const garder = useCallback(() => {
    if (ouvert && zone.current) positions.current.set(ouvert, zone.current.scrollTop);
  }, [ouvert]);

  const ouvrir = useCallback(
    (cle: string) => {
      if (!ouvert) declencheur.current = document.activeElement as HTMLElement | null;
      garder();
      setOuvert(cle);
    },
    [ouvert, garder],
  );

  const fermer = useCallback(() => {
    garder();
    setOuvert(null);
    requestAnimationFrame(() => declencheur.current?.focus());
  }, [garder]);

  useLayoutEffect(() => {
    if (ouvert && zone.current) zone.current.scrollTop = positions.current.get(ouvert) ?? 0;
  }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermer();
    };
    window.addEventListener("keydown", touche);
    return () => {
      document.body.style.overflow = avant;
      window.removeEventListener("keydown", touche);
    };
  }, [ouvert, fermer]);

  const i = textes.findIndex((t) => t.cle === ouvert);
  const texte = i >= 0 ? textes[i] : null;
  const suivant = i >= 0 ? textes[i + 1] : undefined;

  return (
    <Ouvrir.Provider value={ouvrir}>
      {children}
      {texte ? (
        <div ref={zone} role="dialog" aria-modal="true" aria-label={texte.titre} className="fixed inset-0 z-50 overflow-y-auto bg-papier md:bg-violet-nuit/90 md:px-6 md:py-12">
          <div className="min-h-full bg-papier text-encre md:mx-auto md:min-h-0 md:max-w-[860px] md:rounded-[6px] md:px-[60px] md:shadow-[0_20px_60px_rgba(20,0,16,.35)]">
            <div className="sticky top-0 z-10 border-b border-[var(--filet-papier)] bg-papier px-[22px] md:-mx-[60px] md:px-[60px]">
              <div className="flex items-center justify-between gap-3 py-2 md:py-3">
                <div role="tablist" aria-label="Les textes de la séance" className="flex min-w-0 gap-4 overflow-x-auto [scrollbar-width:none]">
                  {textes.map((t) => (
                    <button
                      key={t.cle}
                      type="button"
                      role="tab"
                      aria-selected={t.cle === ouvert}
                      onClick={() => ouvrir(t.cle)}
                      className={`inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap border-b-2 font-titre text-[14px] text-violet ${t.cle === ouvert ? "border-rouge font-semibold" : "border-transparent font-medium opacity-70"}`}
                    >
                      {t.onglet}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={fermer} className="bouton-fantome shrink-0 !min-h-[44px] !py-2">
                  Fermer
                </button>
              </div>
            </div>
            <div className="px-[22px] md:mx-auto md:max-w-[66ch] md:px-0">
              <div className="flex flex-col gap-2.5 pt-7 md:pt-[52px]">
                <h1 className="m-0 font-titre text-[34px] font-semibold leading-[0.98] tracking-[-0.03em] text-violet md:text-[48px]">{texte.titre}</h1>
                {texte.meta ? <p className="m-0 text-[14px] text-violet/85">{texte.meta}</p> : null}
                <div aria-hidden className="mb-[26px] mt-[18px] h-px bg-[var(--filet-papier)]" />
              </div>
              <div key={texte.cle}>{texte.contenu}</div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--filet-papier)] pb-[60px] pt-[30px]">
                <button type="button" onClick={fermer} className="bouton-fantome !min-h-[44px] !py-2">
                  Fermer
                </button>
                {suivant ? (
                  <button type="button" onClick={() => ouvrir(suivant.cle)} className="aller text-[16px] text-rouge">
                    Suivant : {suivant.annonce} →
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Ouvrir.Provider>
  );
}

// Un geste qui ouvre la liseuse sur un texte précis.
export function OuvrirLecture({ cle, className = "", children }: { cle: string; className?: string; children: React.ReactNode }) {
  const ouvrir = useContext(Ouvrir);
  return (
    <button type="button" onClick={() => ouvrir(cle)} className={`aller ${className}`}>
      {children}
    </button>
  );
}
