import Link from "next/link";

// « Mode en séance » : l'écran épuré pendant la visio.
export function ModeEnSeance({ href }: { href: string }) {
  return (
    <Link href={href} className="bouton-rouge inline-flex items-center">
      Mode en séance
    </Link>
  );
}
