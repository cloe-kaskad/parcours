import { Logo } from "./Logo";
import { Retour } from "./Retour";

export function EnteteSousPage({ surPapier = false }: { surPapier?: boolean }) {
  return (
    <div className="flex items-center justify-between pt-[22px] md:pt-9">
      <Retour surPapier={surPapier} />
      <div className="md:hidden">
        <Logo couleur={surPapier ? "violet" : "blanc"} hauteur={34} />
      </div>
    </div>
  );
}
