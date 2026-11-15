import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageCoach } from "@/components/coach/base";
import { EditeurVersionSeance } from "@/components/coach/EditeurVersionSeance";
import { exigerCoach } from "@/lib/auth";
import { chargerAvant } from "@/lib/db/coach";
import { createClient } from "@/lib/supabase/server";
import type { SeancePreparation } from "@/lib/supabase/types";
import { decouper, empreinte, preparationLisible, versMarkdown } from "@/lib/version-seance";

export const metadata = { title: "Version séance" };

// Modifier la version séance, section par section (Cloé seule). La préparation n'est jamais touchée.
export default async function PageVersionSeance({ params }: PageProps<"/coach/clientes/[id]/seances/[seanceId]/version-seance">) {
  await exigerCoach();
  const { id, seanceId } = await params;
  const d = await chargerAvant(seanceId, true);
  if (!d || d.cliente.id !== id) notFound();
  const avant = `/coach/clientes/${id}/seances/${seanceId}/avant`;
  const supabase = await createClient();
  const { data } = await supabase.from("seances_preparations").select("version_seance, version_seance_empreinte").eq("seance_id", seanceId).maybeSingle<Pick<SeancePreparation, "version_seance" | "version_seance_empreinte">>();
  const version = data?.version_seance;
  if (!version?.length) redirect(avant);
  const source = decouper(d.preparation);
  const change = data?.version_seance_empreinte !== empreinte(d.preparation);

  return (
    <PageCoach>
      <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-carte-filet px-[22px] lg:px-10">
        <Link href={avant} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-violet">
          ← Avant la séance
        </Link>
        <Link href={`/coach/clientes/${id}/seances/${seanceId}/en-seance`} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-rouge">
          Mode en séance
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-[22px] pb-16 pt-6 lg:px-0">
        <header className="flex flex-col gap-1.5">
          <h1 className="m-0 font-titre text-[28px] font-semibold leading-none tracking-[-0.03em] text-violet lg:text-[40px]">
            Version séance · {d.cliente.prenom} · séance {d.seance.numero}
          </h1>
          <p className="m-0 text-[15px] leading-[1.5] text-violet/85">Toi seule. Mêmes sections que la préparation, dans le même ordre ; la préparation n’est pas modifiée.</p>
          {change ? <p className="m-0 rounded-[8px] border border-rouge/40 bg-white px-4 py-2.5 text-[15px] text-violet">La préparation a changé depuis cette version : reproposer depuis « Avant la séance » ?</p> : null}
        </header>
        <EditeurVersionSeance seanceId={seanceId} initiales={version} source={source.map((s) => preparationLisible(versMarkdown(s.blocs)))} />
      </div>
    </PageCoach>
  );
}
