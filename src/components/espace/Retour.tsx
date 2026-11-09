import Link from "next/link";

// Le retour clair des sous-pages.
export function Retour({ surPapier = false }: { surPapier?: boolean }) {
  return (
    <Link href="/espace" className={`t-action inline-flex min-h-[44px] items-center text-[14px] ${surPapier ? "text-violet" : "text-creme"}`}>
      ← Mon espace
    </Link>
  );
}
