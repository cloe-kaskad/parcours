import Link from "next/link";
import { notFound } from "next/navigation";
import { Bandeau } from "@/components/espace/Bandeau";
import { Calendrier } from "@/components/espace/Calendrier";
import { EnteteSousPage } from "@/components/espace/EnteteSousPage";
import { TexteLettre } from "@/components/espace/TexteLettre";
import { exigerCliente } from "@/lib/auth";
import { jourComplet } from "@/lib/dates";
import { maSeance } from "@/lib/db/cliente";
import { urlSignee } from "@/lib/fichiers";
import { titrePropre } from "@/lib/textes";

export const metadata = { title: "Lire la séance" };

function duree(sec: number | null) {
  if (!sec) return "";
  const min = Math.round(sec / 60);
  const h = Math.floor(min / 60);
  const reste = String(min % 60).padStart(2, "0");
  return h ? `, ${h}h${reste}` : `, ${min} min`;
}

export default async function LireSeance({ params }: PageProps<"/espace/seance/[id]">) {
  const { id } = await params;
  const profil = await exigerCliente();
  const donnees = await maSeance(id);
  if (!donnees) notFound();
  const { seance, lettre } = donnees;
  const segments = seance.transcript_segments ?? [];
  // La RLS vient de confirmer que cette séance est la sienne.
  const pdf = !segments.length && !seance.transcript_formate && seance.transcript_pdf_path ? await urlSignee("transcripts", seance.transcript_pdf_path) : null;

  return (
    <div className="papier papier-page flex flex-1 flex-col">
      <Bandeau prenom={profil.prenom} />
      <article className="mx-auto flex w-full max-w-[640px] flex-col px-6">
        <EnteteSousPage surPapier />

        <header className="flex items-center gap-4 pt-9">
          {seance.date ? <Calendrier date={seance.date} prochaine surPapier /> : null}
          <div className="flex flex-col gap-1">
            <h1 className="t-page text-violet">Séance {seance.numero}</h1>
            {seance.date ? (
              <p className="font-italique text-[14px] italic text-violet/80">
                {jourComplet(seance.date)}
                {duree(seance.audio_duree_sec)}
              </p>
            ) : null}
          </div>
        </header>

        {seance.mots_cles.length ? <p className="pt-[22px] font-titre text-[20px] font-semibold tracking-[-0.01em] text-rouge">{seance.mots_cles.join(" · ")}</p> : null}

        <div className="mt-[30px] flex flex-col gap-[22px] border-t border-violet/25 pt-[18px]">
          {segments.map((s, i) => (
            <div key={i} className={`flex flex-col gap-1 ${/^clo[ée]/i.test(s.locuteur) ? "border-l border-violet/30 pl-[22px]" : ""}`}>
              <p className="font-titre text-[12px] font-semibold tracking-[0.04em] text-violet">{s.locuteur}</p>
              <p className="t-lecture whitespace-pre-line">{s.texte}</p>
            </div>
          ))}
          {!segments.length && seance.transcript_formate ? <TexteLettre encadres={false}>{seance.transcript_formate}</TexteLettre> : null}
          {pdf ? (
            <p className="t-lecture">
              Le texte de cette séance est dans son document.{" "}
              <a href={pdf} target="_blank" rel="noreferrer" className="t-action text-rouge">
                Ouvrir le transcript →
              </a>
            </p>
          ) : null}
          {!segments.length && !seance.transcript_formate && !pdf ? <p className="t-lecture text-encre/70">Le texte de cette séance n’est pas encore là.</p> : null}
        </div>

        {lettre ? (
          <div className="mt-11 flex flex-col gap-2 border-t border-violet/25 pb-[60px] pt-[26px]">
            <p className="font-italique text-[14px] italic text-violet">Après cette séance</p>
            <Link href={`/espace/lettre/${lettre.id}`} className="t-action py-1.5 text-[20px] text-rouge">
              Lire la lettre « {titrePropre(lettre.titre)} » →
            </Link>
          </div>
        ) : (
          <div className="pb-[60px]" />
        )}
      </article>
    </div>
  );
}
