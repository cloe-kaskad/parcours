// La surface crème granulée : ce qu'on lit et ce qu'on écrit.
export function Papier({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`papier ${className}`}>{children}</div>;
}
