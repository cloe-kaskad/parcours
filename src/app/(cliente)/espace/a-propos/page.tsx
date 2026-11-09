import { Papier } from "@/components/espace/Papier";
import { Retour } from "@/components/espace/Retour";
import { TexteLettre } from "@/components/espace/TexteLettre";
import { A_PROPOS } from "@/content/a-propos";

export const metadata = { title: "À propos" };

export default function APropos() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-3.5 py-6">
      <div className="px-2">
        <Retour />
        <h1 className="t-zone mt-3 text-creme">à propos</h1>
      </div>
      <Papier className="px-6 py-8 md:px-11">
        <TexteLettre>{A_PROPOS}</TexteLettre>
      </Papier>
    </div>
  );
}
