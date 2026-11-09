import { FORMAT_LARGE, FORMAT_MOBILE, tracerChemin, type Format, type Station } from "@/lib/chemin";

function Dessin({ stations, graine, format, className }: { stations: Station[]; graine: string; format: Format; className: string }) {
  const { d, points, vide, mots } = tracerChemin(stations, graine, format);
  const id = `fondu-${format.largeur}`;
  return (
    <svg viewBox={`0 0 ${format.largeur} ${format.hauteur}`} className={`h-full w-full ${className}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F7BECA" stopOpacity="0.9" />
          <stop offset="0.86" stopColor="#F7BECA" stopOpacity="0.9" />
          <stop offset="1" stopColor="#F7BECA" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d} pathLength={1} fill="none" stroke={`url(#${id})`} strokeWidth="1.5" className="entree-trace" />
      <g className="entree-station">
        {points.map((p) => (
          <circle key={p.x} cx={p.x} cy={p.y} r={p.rayon} fill="#F7BECA" />
        ))}
        <circle cx={vide.x} cy={vide.y} r={vide.rayon} fill="none" stroke="#F7BECA" strokeOpacity="0.5" strokeWidth="1.5" />
        {mots.map((m) => (
          <text key={m.texte + m.x} x={m.x} y={m.y} fill="#F7BECA" fillOpacity={m.opacite} fontSize={m.taille} fontWeight={m.poids} fontFamily="var(--font-titre)" letterSpacing={m.taille > 18 ? "-0.02em" : undefined}>
            {m.texte}
          </text>
        ))}
      </g>
    </svg>
  );
}

// Le tracé sous la photo : pas de chiffre, pas de pourcentage.
export function TraceChemin({ stations, graine }: { stations: Station[]; graine: string }) {
  return (
    <div className="h-[206px] overflow-hidden bg-violet-nuit md:h-[220px]">
      <Dessin stations={stations} graine={graine} format={FORMAT_MOBILE} className="md:hidden" />
      <Dessin stations={stations} graine={graine} format={FORMAT_LARGE} className="hidden md:block" />
    </div>
  );
}
