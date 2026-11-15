import { notFound } from "next/navigation";
import { EcranSeance } from "@/components/coach/EcranSeance";
import { exigerCoach } from "@/lib/auth";
import { chargerAvant } from "@/lib/db/coach";
import { partagerCarnet } from "@/lib/dossier";
import { createClient } from "@/lib/supabase/server";
import type { SeancePreparation } from "@/lib/supabase/types";
import { decouper, empreinte } from "@/lib/version-seance";

export const metadata = { title: "En séance" };

type Ligne = Pick<SeancePreparation, "notes_seance" | "version_seance" | "version_seance_empreinte">;

// Pendant la séance : la version séance (ou la préparation complète), ce qu'elle veut aborder, les notes.
export default async function EnSeance({ params }: PageProps<"/coach/clientes/[id]/seances/[seanceId]/en-seance">) {
  await exigerCoach();
  const { id, seanceId } = await params;
  const d = await chargerAvant(seanceId, true);
  if (!d || d.cliente.id !== id) notFound();
  const supabase = await createClient();
  const requete = await supabase.from("seances_preparations").select("notes_seance, version_seance, version_seance_empreinte").eq("seance_id", seanceId).maybeSingle<Ligne>();
  // Tant que la migration 0008 n'est pas appliquée : les notes seules, la préparation complète.
  const ligne: Ligne | null = requete.error
    ? ((await supabase.from("seances_preparations").select("notes_seance").eq("seance_id", seanceId).maybeSingle<Ligne>()).data ?? null)
    : requete.data;
  const { aAborder } = partagerCarnet(d);
  const version = ligne?.version_seance?.length ? ligne.version_seance : null;
  const avant = `/coach/clientes/${id}/seances/${seanceId}/avant`;

  return (
    <EcranSeance
      seanceId={seanceId}
      entete={`${d.cliente.prenom} · séance ${d.seance.numero}`}
      quitter={avant}
      avant={`${avant}#prepa`}
      version={version}
      complete={decouper(d.preparation)}
      aChange={!!version && !!ligne?.version_seance_empreinte && ligne.version_seance_empreinte !== empreinte(d.preparation)}
      aAborder={aAborder.map((e) => ({ id: e.id, contenu: e.contenu }))}
      notesInitiales={ligne?.notes_seance ?? ""}
    />
  );
}
