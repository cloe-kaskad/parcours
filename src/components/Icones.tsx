// Icônes de navigation, traits simples, héritent de la couleur du texte.
type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function IconeAccueil({ className = "" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
    </svg>
  );
}
export function IconeChemin({ className = "" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M6 20c0-5 12-3 12-8 0-3-3-4-5-4" />
      <circle cx="6" cy="20" r="1.8" />
      <circle cx="13" cy="8" r="1.8" />
      <path d="M13 8c2 0 4-1 5-4" />
    </svg>
  );
}
export function IconeExercices({ className = "" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <rect x="5" y="4" width="14" height="16" rx="2.5" />
      <path d="m8.5 12 2.2 2.2L15.5 9.5" />
    </svg>
  );
}
export function IconeJournal({ className = "" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M5 4.5h11a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2z" />
      <path d="M8 9h6M8 12.5h6" />
    </svg>
  );
}
export function IconePlus({ className = "" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="5.5" cy="12" r="1.3" />
      <circle cx="18.5" cy="12" r="1.3" />
    </svg>
  );
}
export function IconeSeances({ className = "" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </svg>
  );
}
export function IconeRessources({ className = "" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <circle cx="12" cy="12" r="8" />
      <path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconeFleche({ className = "" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
