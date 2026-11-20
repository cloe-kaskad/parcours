import { notFound } from "next/navigation";
import { Pratiques } from "@/components/espace/Pratiques";
import { exigerCliente } from "@/lib/auth";
import { preparerPratiques } from "@/lib/pratiques-page";

export const metadata = { title: "Mes pratiques" };

// « Mes pratiques » (docs/09, section 3) : la page serveur prépare, le composant Pratiques fait lire.
export default async function PageMesPratiques({ params }: PageProps<"/espace/pratiques/[id]">) {
  const { id } = await params;
  const profil = await exigerCliente();
  const donnees = await preparerPratiques(id, profil.id);
  if (!donnees) notFound();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { envoyee, ...props } = donnees;
  return (
    <div className="papier papier-page flex flex-1 flex-col">
      <Pratiques {...props} />
    </div>
  );
}
