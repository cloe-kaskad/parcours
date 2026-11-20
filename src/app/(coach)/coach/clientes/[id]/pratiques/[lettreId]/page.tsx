import { notFound } from "next/navigation";
import { Pratiques } from "@/components/espace/Pratiques";
import { exigerEquipe } from "@/lib/auth";
import { clienteDuParcours } from "@/lib/db/coach";
import { preparerPratiques } from "@/lib/pratiques-page";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Ses pratiques, comme elle les voit" };

// « Mes pratiques » telle que la cliente la voit, pour Cloé et Émilien (brouillon compris).
// Les gestes d'écriture s'ouvrent mais n'enregistrent rien.
export default async function ApercuPratiques({ params }: PageProps<"/coach/clientes/[id]/pratiques/[lettreId]">) {
  const profil = await exigerEquipe();
  const { id, lettreId } = await params;
  const { data: serie } = await (await createClient()).from("pratiques_series").select("parcours_id").eq("id", lettreId).maybeSingle<{ parcours_id: string }>();
  const qui = serie ? await clienteDuParcours(serie.parcours_id) : null;
  if (!qui || qui.cliente.id !== id) notFound();
  const donnees = await preparerPratiques(lettreId, id, true);
  if (!donnees) notFound();
  const { envoyee, ...props } = donnees;
  const prenom = qui.cliente.prenom;
  return (
    <div className="papier papier-page flex min-h-dvh flex-1 flex-col">
      <p className="bg-violet-nuit px-5 py-2.5 text-center text-[14px] text-creme md:px-10">
        Aperçu : ce que {prenom} voit{envoyee ? "" : " quand tu auras envoyé ces pratiques"}. Rien ne s’enregistre ici.
      </p>
      <Pratiques
        {...props}
        apercu={{
          retour: profil.role === "coach" ? `/coach/clientes/${id}/lettre/${lettreId}` : `/coach/clientes/${id}`,
          libelleRetour: profil.role === "coach" ? "Revenir à l’éditeur" : prenom,
          base: `/coach/clientes/${id}/pratiques`,
        }}
      />
    </div>
  );
}
