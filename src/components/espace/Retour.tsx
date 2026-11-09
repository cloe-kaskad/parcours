import Link from "next/link";

// Le retour clair des sous-pages.
export function Retour() {
  return (
    <Link href="/espace" className="t-action inline-block py-3 text-[16px] text-rose">
      ← Mon espace
    </Link>
  );
}
