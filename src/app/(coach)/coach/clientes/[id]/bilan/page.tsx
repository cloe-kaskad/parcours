import { notFound } from "next/navigation";
import { PageCoach } from "@/components/coach/base";
import { Barre } from "@/components/coach/Entete";
import { exigerCoach } from "@/lib/auth";
import { chargerBilan } from "@/lib/bilan";

export const metadata = { title: "Bilan de cycle" };

// Le bilan de fin de parcours, tel qu'il sera dans le PDF. Rien ne part vers elle : Cloé le télécharge et choisit.
export default async function Bilan({ params }: PageProps<"/coach/clientes/[id]/bilan">) {
  await exigerCoach();
  const { id } = await params;
  const b = await chargerBilan(id);
  if (!b) notFound();
  const stations = b.seances.flatMap((x) => (x.station ? [x.station] : []));
  return (
    <PageCoach>
      <Barre retour={{ href: `/coach/clientes/${id}`, libelle: b.prenom }} cliente={b.prenom} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-[22px] pb-16 pt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-[14px] text-violet">Rien ne part vers {b.prenom} : tu télécharges le PDF et tu choisis quand le lui donner.</p>
          <a href={`/api/bilan/${id}`} className="bouton-rouge inline-flex items-center">
            Télécharger le PDF
          </a>
        </div>
        <article className="carte-blanche flex flex-col gap-4 px-6 py-7 md:px-10">
          {b.periode ? <p className="m-0 font-italique text-[15px] italic text-violet">{b.periode}</p> : null}
          <h1 className="m-0 font-titre text-[34px] font-semibold leading-none tracking-[-0.03em] text-violet">
            {b.prenom}, {b.seances.length} séance{b.seances.length > 1 ? "s" : ""}
          </h1>
          {stations.length ? <p className="m-0 font-titre text-[17px] font-semibold text-rouge">{stations.join(" · ")}</p> : null}
          {b.intention ? (
            <section className="flex flex-col gap-1.5">
              <h2 className="m-0 font-titre text-[20px] font-semibold text-violet">L’intention du départ</h2>
              <p className="m-0 text-[16px] leading-[1.6]">{b.intention}</p>
            </section>
          ) : null}
          <section className="flex flex-col gap-1.5">
            <h2 className="m-0 font-titre text-[20px] font-semibold text-violet">Le chemin, séance après séance</h2>
            {b.seances.map((x) => (
              <p key={x.numero} className="m-0 text-[16px] leading-[1.6]">
                <strong className="font-semibold">Séance {x.numero}</strong>
                {x.date ? `, ${x.date}` : ""} : {x.mots.length ? x.mots.join(", ") : "sans mots posés"}
                {x.station ? `. ${x.station}` : ""}
              </p>
            ))}
          </section>
          {b.lettres.length ? (
            <section className="flex flex-col gap-1">
              <h2 className="m-0 font-titre text-[20px] font-semibold text-violet">Les pratiques</h2>
              {b.lettres.map((l, i) => (
                <p key={i} className="m-0 text-[16px]">
                  {l.titre}
                  {l.date ? <span className="text-violet">, {l.date}</span> : null}
                </p>
              ))}
            </section>
          ) : null}
          {b.paroles.length ? (
            <section className="flex flex-col gap-2">
              <h2 className="m-0 font-titre text-[20px] font-semibold text-violet">Ce que tu as écrit</h2>
              {b.paroles.map((p, i) => (
                <div key={i} className="border-l-[3px] border-rose pl-3">
                  {p.date ? <p className="m-0 text-[14px] text-violet">{p.date}</p> : null}
                  <p className="m-0 whitespace-pre-line text-[16px] leading-[1.6]">{p.texte}</p>
                </div>
              ))}
            </section>
          ) : null}
        </article>
      </div>
    </PageCoach>
  );
}
