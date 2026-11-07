import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { FormulaireConnexion } from "./FormulaireConnexion";

export const metadata: Metadata = { title: "Connexion" };

export default async function Connexion({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const suite = typeof params.suite === "string" ? params.suite : undefined;
  const erreur = typeof params.erreur === "string" ? params.erreur : undefined;

  return (
    <main className="coquille-violette flex flex-1 flex-col bg-violet px-5 py-8 text-creme">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="bloc mb-12">
          <Logo surViolet />
        </div>
        <h1 className="bloc text-[2.6rem] font-bold leading-[0.95] md:text-5xl">
          Ton espace
          <br />
          t’attend.
        </h1>
        <p className="bloc mt-5 max-w-sm text-base leading-relaxed text-creme/75">
          Tes séances, tes exercices, ton journal. Tout ce qu’on construit ensemble, au même endroit.
        </p>
        <div className="bloc carte mt-10 p-6">
          {erreur === "lien" ? (
            <p className="mb-5 rounded-xl bg-rouge/10 px-4 py-3 text-sm text-rouge" role="alert">
              Ce lien n’est plus valable. Demande-en un nouveau.
            </p>
          ) : null}
          <FormulaireConnexion suite={suite} />
        </div>
      </div>
    </main>
  );
}
