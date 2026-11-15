"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Dans la lettre, sur téléphone : une barre collante avec le retour et « exercice n sur N ».
export function BarreLettre({ ids }: { ids: string[] }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const cibles = ids.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => Boolean(e));
    if (!cibles.length) return;
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (e.isIntersecting) setN(ids.indexOf(e.target.id) + 1);
        }
      },
      { rootMargin: "-60px 0px -60% 0px" },
    );
    cibles.forEach((c) => observateur.observe(c));
    return () => observateur.disconnect();
  }, [ids]);

  return (
    <div className="sticky top-0 z-20 -mx-6 flex items-center justify-between border-b border-[var(--filet-papier)] bg-papier px-6 py-1.5 md:hidden">
      <Link href="/espace" className="t-action inline-flex min-h-[44px] items-center text-[14px] text-violet">
        ← Mon espace
      </Link>
      {ids.length ? <span className="text-[14px] text-violet">{n ? `exercice ${n} sur ${ids.length}` : `${ids.length} exercice${ids.length > 1 ? "s" : ""}`}</span> : null}
    </div>
  );
}
