"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Un texte long avec son geste « Lire » : il s'ouvre en pleine page par-dessus (fond papier,
// colonne centrée), se ferme par Échap ou « Fermer », et retrouve la position de lecture.
// `replie` : sur place, seul le début se voit.
export function Lisible({ titre, replie = false, children }: { titre: string; replie?: boolean; children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const position = useRef(0);
  const bouton = useRef<HTMLButtonElement>(null);

  const fermer = () => {
    position.current = zone.current?.scrollTop ?? 0;
    setOuvert(false);
    requestAnimationFrame(() => bouton.current?.focus());
  };

  useLayoutEffect(() => {
    if (ouvert && zone.current) zone.current.scrollTop = position.current;
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
  }, [ouvert]);

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={zone}
        role={ouvert ? "dialog" : undefined}
        aria-modal={ouvert || undefined}
        aria-label={ouvert ? titre : undefined}
        className={ouvert ? "papier fixed inset-0 z-50 overflow-y-auto rounded-none" : `relative ${replie ? "max-h-[19rem] overflow-hidden" : ""}`}
      >
        {ouvert ? (
          <div className="sticky top-0 z-10 border-b border-[var(--filet-papier)] bg-papier">
            <div className="mx-auto flex max-w-[66ch] items-center justify-between gap-4 px-5 py-2">
              <span className="truncate font-titre text-[15px] font-semibold text-violet">{titre}</span>
              <button type="button" onClick={fermer} autoFocus className="outil min-h-[44px] shrink-0">
                Fermer
              </button>
            </div>
          </div>
        ) : null}
        <div className={ouvert ? "mx-auto max-w-[66ch] px-5 pb-24 pt-8 md:pt-12" : ""}>{children}</div>
        {!ouvert && replie ? <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--fond-lisible,var(--papier))] to-transparent" /> : null}
      </div>
      {!ouvert ? (
        <button ref={bouton} type="button" onClick={() => setOuvert(true)} className="outil min-h-[44px] self-start">
          Lire{replie ? " en entier" : ""}
        </button>
      ) : null}
    </div>
  );
}
