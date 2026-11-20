import type { Metadata, Viewport } from "next";
import { Logo } from "@/components/espace/Logo";
import { FormulaireConnexion } from "./FormulaireConnexion";

export const metadata: Metadata = { title: "Connexion" };
export const viewport: Viewport = { themeColor: "#59114D" };

// Les retours de /auth/callback : lien périmé, adresse inconnue (aucun compte n'est créé).
const MESSAGES: Record<string, { message: string; inconnu?: boolean }> = {
  lien: { message: "Ce lien n’est plus valable. Demande-en un nouveau." },
  inconnu: { message: "Ce compte n’existe pas encore.", inconnu: true },
  google: { message: "La connexion avec Google n’a pas abouti. Réessaie, ou utilise ton adresse email." },
};

export default async function Connexion({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const suite = typeof params.suite === "string" ? params.suite : undefined;
  const erreur = typeof params.erreur === "string" ? params.erreur : undefined;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col justify-between gap-12 bg-violet px-7 pb-10 pt-7 text-creme">
      <Logo couleur="clair" hauteur={42} />
      <FormulaireConnexion suite={suite} message={MESSAGES[erreur ?? ""] ?? null} />
      <p className="text-[14px] text-creme/55">Un espace privé, pour toi seule. Cloé y lit ce que tu lui adresses, rien d’autre.</p>
    </main>
  );
}
