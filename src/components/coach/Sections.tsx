"use client";

import { useEffect, useState } from "react";

// La barre de sections collante (téléphone) : une puce par section, celle qu'on lit est pleine.
export function Sections({ sections, className = "" }: { sections: { id: string; libelle: string }[]; className?: string }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const cibles = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => Boolean(e));
    if (!cibles.length) return;
    const observateur = new IntersectionObserver(
      (entrees) => {
        const visible = entrees.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-80px 0px -55% 0px" },
    );
    cibles.forEach((c) => observateur.observe(c));
    return () => observateur.disconnect();
  }, [sections]);

  useEffect(() => {
    document.getElementById(`puce-${active}`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  return (
    <nav aria-label="Sections de la page" className={`sections ${className}`}>
      {sections.map((s) => (
        <a key={s.id} id={`puce-${s.id}`} href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined} onClick={() => setActive(s.id)} className="section-puce">
          {s.libelle}
        </a>
      ))}
    </nav>
  );
}
