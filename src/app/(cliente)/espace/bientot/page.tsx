import { Retour } from "@/components/espace/Retour";

// Page provisoire : remplacée à l'étape 2 par la lettre, le carnet, la séance et les ressources.
export const metadata = { title: "Bientôt" };

export default function Bientot() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-[22px] py-6">
      <Retour />
      <h1 className="t-zone text-creme">cette page arrive</h1>
      <p className="t-lecture text-creme">Elle se prépare, tu la trouveras ici très vite.</p>
    </div>
  );
}
