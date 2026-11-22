// Le guide iPhone en trois étapes illustrées : Safari, Partager, Sur l'écran d'accueil.

function Safari() {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className="size-14 shrink-0">
      <rect width="64" height="64" rx="14" fill="#fff" />
      <circle cx="32" cy="32" r="22" fill="#2F8CF5" />
      <circle cx="32" cy="32" r="19" fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="1.5 3.2" />
      <path d="M32 32 L44 20 L36 36 Z" fill="#E6361D" />
      <path d="M32 32 L20 44 L28 28 Z" fill="#fff" />
    </svg>
  );
}

function Partager() {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className="size-14 shrink-0">
      <rect width="64" height="64" rx="14" fill="#fff" />
      <path d="M22 28 h-3 a3 3 0 0 0 -3 3 v17 a3 3 0 0 0 3 3 h26 a3 3 0 0 0 3 -3 v-17 a3 3 0 0 0 -3 -3 h-3" fill="none" stroke="#2F8CF5" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 38 V12 M24 19 L32 11 L40 19" fill="none" stroke="#2F8CF5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EcranAccueil() {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className="size-14 shrink-0">
      <rect width="64" height="64" rx="14" fill="#fff" />
      <rect x="15" y="15" width="34" height="34" rx="8" fill="none" stroke="#111" strokeWidth="3" />
      <path d="M32 23 V41 M23 32 H41" stroke="#111" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const ETAPES = [
  { image: <Safari />, titre: "Ouvre ton espace dans Safari", texte: "L’installation passe par Safari, le navigateur de l’iPhone." },
  { image: <Partager />, titre: "Touche « Partager »", texte: "Le carré avec une flèche vers le haut, en bas de l’écran. Sur les iPhone récents, il est dans le menu « ••• »." },
  { image: <EcranAccueil />, titre: "Choisis « Sur l’écran d’accueil »", texte: "Fais défiler si besoin, laisse « Ouvrir comme app web » activé, puis touche « Ajouter »." },
];

export function GuideIphone({ surPapier = false }: { surPapier?: boolean }) {
  return (
    <ol className="flex flex-col gap-3">
      {ETAPES.map((e, i) => (
        <li key={i} className={`flex items-start gap-3.5 rounded-[10px] px-3.5 py-3 ${surPapier ? "border border-carte-filet bg-white text-encre" : "bg-violet-nuit text-creme"}`}>
          {e.image}
          <span className="flex flex-col gap-1">
            <span className={`font-titre text-[17px] font-semibold leading-[1.15] ${surPapier ? "text-violet" : ""}`}>
              {i + 1}. {e.titre}
            </span>
            <span className="text-[15px] leading-[1.45] opacity-90">{e.texte}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
