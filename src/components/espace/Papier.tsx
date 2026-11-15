// La carte de ce qu'on lit et de ce qu'on écrit : blanche, un filet, sans ombre (règle 0b).
export function Papier({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`carte-blanche ${className}`}>{children}</div>;
}
