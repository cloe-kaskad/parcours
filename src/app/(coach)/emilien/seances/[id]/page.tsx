import { notFound, redirect } from "next/navigation";
import { Barre, PageCoach } from "@/components/coach/base";
import { LecteurEmilien } from "@/components/coach/LecteurEmilien";
import { MonRetour } from "@/components/coach/MonRetour";
import { TexteLettre } from "@/components/espace/TexteLettre";
import { exigerEquipe } from "@/lib/auth";
import { jourComplet } from "@/lib/dates";
import { chargerLecture } from "@/lib/db/coach";

export const metadata = { title: "Lire et répondre" };

function duree(sec: number | null) {
  if (!sec) return "";
  const min = Math.round(sec / 60);
  return min >= 60 ? ` · ${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}` : ` · ${min} min`;
}

export default async function LireRepondre({ params }: PageProps<"/emilien/seances/[id]">) {
  const { id } = await params;
  const profil = await exigerEquipe();
  const d = await chargerLecture(id, profil.id);
  if (!d) notFound();
  const { seance, cliente, audio, pdf, retour } = d;
  if (profil.role === "coach") redirect(`/coach/clientes/${cliente.id}/seances/${id}`);
  const segments = seance.transcript_segments ?? [];

  return (
    <PageCoach>
      <Barre retour={{ href: "/emilien", libelle: "À lire" }} droite={<span className="font-italique text-[13px] italic text-rose">{profil.prenom}</span>} />
      <div className="px-[22px] md:grid md:grid-cols-[1fr_420px] md:gap-12 md:px-10">
        <div className="flex min-w-0 flex-col">
          <header className="flex flex-col gap-1 pt-7">
            <h1 className="font-titre text-[34px] font-semibold leading-[0.95] tracking-[-0.03em] text-violet">
              {cliente.prenom} · séance {seance.numero}
            </h1>
            {seance.date ? <p className="font-italique text-[14px] italic text-violet/80">{jourComplet(seance.date)}{duree(seance.audio_duree_sec)}</p> : null}
          </header>
          {audio ? (
            <div className="pt-[22px]">
              <LecteurEmilien src={audio} seanceId={seance.id} dureeConnue={seance.audio_duree_sec} />
            </div>
          ) : null}
          <div className="mt-[30px] flex flex-col gap-5 border-t border-violet/20 pt-[18px]">
            {segments.map((s, i) => (
              <div key={i} className={`flex flex-col gap-1 ${/^clo[ée]/i.test(s.locuteur) ? "border-l border-violet/30 pl-5" : ""}`}>
                <p className="font-titre text-[12px] font-semibold tracking-[0.04em] text-violet">{s.locuteur}</p>
                <p className="t-lecture whitespace-pre-line">{s.texte}</p>
              </div>
            ))}
            {!segments.length && seance.transcript_formate ? <TexteLettre encadres={false}>{seance.transcript_formate}</TexteLettre> : null}
            {pdf ? (
              <a href={pdf} target="_blank" rel="noreferrer" className="t-action text-[15px] text-violet">
                Ouvrir le PDF →
              </a>
            ) : null}
          </div>
        </div>
        <aside className="mt-10 border-t border-violet/20 pb-[60px] pt-6 md:sticky md:top-6 md:mt-0 md:self-start md:border-t-0 md:pt-7">
          <MonRetour seanceId={seance.id} prenom={cliente.prenom} initial={retour?.contenu ?? ""} urlInitiale={retour?.ressource_proposee_url ?? ""} motInitial={retour?.ressource_proposee_mot ?? ""} dejaEnvoye={Boolean(retour?.envoye_at)} />
        </aside>
      </div>
    </PageCoach>
  );
}
