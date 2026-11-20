import Image from "next/image";

// Le logo fourni par Cloé : violet et rouge sur fond clair, crème et rouge sur fond violet
// (maquettes de design/, logo-clair-rouge).
const FICHIER = { violet: "logo-violet", clair: "logo-clair-rouge" } as const;

export function Logo({ couleur, hauteur }: { couleur: "violet" | "clair"; hauteur: number }) {
  return (
    <Image
      src={`/marque/${FICHIER[couleur]}.svg`}
      alt="Blocages & Intuition"
      width={Math.round((hauteur * 1045) / 425)}
      height={hauteur}
      unoptimized
      priority
      style={{ height: hauteur, width: "auto" }}
    />
  );
}
