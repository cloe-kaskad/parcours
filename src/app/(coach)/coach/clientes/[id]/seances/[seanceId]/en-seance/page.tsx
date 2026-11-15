import Link from "next/link";
import { notFound } from "next/navigation";
import { PageCoach } from "@/components/coach/base";
import { NotesEnSeance } from "@/components/coach/NotesEnSeance";
import { TexteLecture } from "@/components/coach/TexteLecture";
import { exigerCoach } from "@/lib/auth";
import { chargerAvant } from "@/lib/db/coach";
import { partagerCarnet } from "@/lib/dossier";
import { createClient } from "@/lib/supabase/server";
import { extrait } from "@/lib/textes";

export const metadata = { title: "En séance" };

// Pendant la visio : un écran épuré. Ta préparation, ce qu'elle veut aborder, des notes rapides.
export default async function EnSeance({ params }: PageProps<"/coach/clientes/[id]/seances/[seanceId]/en-seance">) {
  await exigerCoach();
  const { id, seanceId } = await params;
  const d = await chargerAvant(seanceId, true);
  if (!d || d.cliente.id !== id) notFound();
  const supabase = await createClient();
  const { data: notes } = await supabase.from("seances_preparations").select("notes_seance").eq("seance_id", seanceId).maybeSingle<{ notes_seance: string }>();
  const { aAborder } = partagerCarnet(d);

  return (
    <PageCoach>
      <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-carte-filet px-[22px] lg:px-10">
        <span className="font-titre text-[16px] font-semibold text-violet">
          {d.cliente.prenom} · séance {d.seance.numero}
        </span>
        <Link href={`/coach/clientes/${id}/seances/${seanceId}/avant`} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-violet">
          Quitter le mode en séance
        </Link>
      </div>
      <div className="mx-auto grid w-full max-w-[1180px] gap-6 px-[22px] pb-16 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-10 lg:px-10">
        <div className="flex flex-col gap-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-2">
          {aAborder.length ? (
            <section className="flex flex-col gap-2">
              <h2 className="surtitre m-0 text-rouge">À aborder</h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {aAborder.map((e) => (
                  <li key={e.id} className="carte-blanche rounded-l-none border-l-[3px] border-l-rose px-3.5 py-2.5 text-[15px] leading-[1.5]">
                    {extrait(e.contenu, 160)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="carte-blanche flex flex-col gap-2 border-t-4 border-t-rouge px-4 py-4">
            <h2 className="surtitre m-0 text-rouge">Ma préparation</h2>
            {d.preparation.trim() ? <TexteLecture className="text-[16px]">{d.preparation}</TexteLecture> : <p className="m-0 text-[15px] text-violet">Pas de préparation pour cette séance.</p>}
          </section>
        </div>
        <div className="lg:sticky lg:top-4">
          <NotesEnSeance seanceId={seanceId} initial={notes?.notes_seance ?? ""} />
        </div>
      </div>
    </PageCoach>
  );
}
