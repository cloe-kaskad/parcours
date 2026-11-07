import Link from "next/link";

// Logo texte : « blocages » en League Spartan, « & INTUITION » en rouge.
// Sur fond violet, « blocages » passe en crème. La police Chloe sera ajoutée quand Cloé fournira le fichier.
export function Logo({
  href = "/",
  taille = "md",
  surViolet = false,
}: {
  href?: string;
  taille?: "sm" | "md";
  surViolet?: boolean;
}) {
  const base = taille === "sm" ? "text-[1.35rem]" : "text-3xl";
  const sous = taille === "sm" ? "text-[0.58rem]" : "text-xs";
  return (
    <Link href={href} className="inline-flex flex-col leading-none" aria-label="Blocages & Intuition">
      <span className={`titre font-bold lowercase tracking-tight ${surViolet ? "text-creme" : "text-violet"} ${base}`}>blocages</span>
      <span className={`titre font-bold uppercase tracking-[0.2em] ${surViolet ? "text-rose" : "text-rouge"} ${sous}`}>&amp; intuition</span>
    </Link>
  );
}
