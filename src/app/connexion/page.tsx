import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { FormulaireConnexion } from "./FormulaireConnexion";

export const metadata: Metadata = { title: "Connexion" };

export default async function Connexion({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const suite = typeof params.suite === "string" ? params.suite : undefined;
  const erreur = typeof params.erreur === "string" ? params.erreur : undefined;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bloc mb-10">
          <Logo />
        </div>
        <h1 className="bloc mb-2 text-4xl font-bold">Ton espace.</h1>
        <p className="bloc mb-8 text-base leading-relaxed text-prune">
          Tes séances, tes pratiques, ton journal. Tout ce qu’on construit ensemble, au même endroit.
        </p>
        {erreur === "lien" ? (
          <p className="bloc mb-6 rounded-xl bg-rouge/10 px-4 py-3 text-sm text-rouge" role="alert">
            Ce lien n’est plus valable. Demande-en un nouveau ci-dessous.
          </p>
        ) : null}
        <FormulaireConnexion suite={suite} />
      </div>
    </main>
  );
}
