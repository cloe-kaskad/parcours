import Image from "next/image";

// Le logo fourni par Cloé : violet et rouge sur image claire, blanc sur violet.
export function Logo({ couleur, hauteur }: { couleur: "violet" | "blanc"; hauteur: number }) {
  return (
    <Image
      src={`/marque/logo-${couleur}.svg`}
      alt="Blocages & Intuition"
      width={Math.round((hauteur * 1045) / 425)}
      height={hauteur}
      unoptimized
      priority
      style={{ height: hauteur, width: "auto" }}
    />
  );
}
