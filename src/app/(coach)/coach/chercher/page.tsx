import Link from "next/link";
import { PageCoach } from "@/components/coach/base";
import { Barre } from "@/components/coach/Entete";
import { exigerEquipe } from "@/lib/auth";
import { avantOuverture, jourEtMoisCourt } from "@/lib/dates";
import { corpusRecherche } from "@/lib/db/coach";
import { chercher } from "@/lib/recherche";
import { titrePropre } from "@/lib/textes";

export const metadata = { title: "Chercher" };

// Chercher dans tout ce qui concerne une cliente (ou toutes) : transcripts, carnet, retours, lettres.
export default async function Chercher({ searchParams }: PageProps<"/coach/chercher">) {
  const moi = await exigerEquipe();
  const estCoach = moi.role === "coach";
  const p = await searchParams;
  const q = typeof p.q === "string" ? p.q : "";
  const cliente = typeof p.cliente === "string" ? p.cliente : "";
  const docs = q.trim().length >= 2 ? await corpusRecherche(estCoach, cliente || undefined) : [];
  const resultats = chercher(docs, q).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const prenom = cliente ? docs[0]?.cliente : null;
  const total = resultats.reduce((n, r) => n + r.total, 0);

  return (
    <PageCoach>
      <Barre retour={cliente ? { href: `/coach/clientes/${cliente}`, libelle: prenom ?? "Sa fiche" } : { href: estCoach ? "/coach" : "/emilien", libelle: estCoach ? "Agenda" : "À lire" }} cliente={prenom ?? undefined} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-[22px] pb-16 pt-7">
        <h1 className="m-0 font-titre text-[34px] font-semibold leading-none tracking-[-0.03em] text-violet">Chercher{prenom ? ` chez ${prenom}` : ""}</h1>
        <form action="/coach/chercher" className="flex flex-col gap-2">
          {cliente ? <input type="hidden" name="cliente" value={cliente} /> : null}
          <label className="flex flex-col gap-1.5 text-[14px] text-violet">
            {prenom ? `Dans ses transcripts, son carnet, les retours et les lettres` : "Dans les transcripts, les carnets, les retours et les lettres"}
            <input name="q" type="search" defaultValue={q} autoFocus placeholder="sa mère, dommage, Attali…" className="champ-zone min-h-[48px]" />
          </label>
          <button type="submit" className="bouton-rouge self-start">
            Chercher
          </button>
        </form>
        {q.trim().length >= 2 ? <p className="m-0 text-[14px] text-violet">{total ? `${total} passage${total > 1 ? "s" : ""} dans ${resultats.length} texte${resultats.length > 1 ? "s" : ""}` : "Rien trouvé."}</p> : null}
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {resultats.map((r) => (
            <li key={r.source + r.lien + r.titre}>
              <Link href={r.lien} className="carte-blanche flex flex-col gap-2 px-4 py-3.5">
                <span className="text-[14px] text-violet">
                  {[!cliente ? r.cliente : null, r.source, r.source === "Lettre" ? titrePropre(r.titre) : r.source === "Carnet" ? (r.date && !avantOuverture(r.date) ? jourEtMoisCourt(r.date) : null) : r.titre, r.total > r.extraits.length ? `${r.total} passages` : null].filter(Boolean).join(" · ")}
                </span>
                {r.extraits.map((e, i) => (
                  <span key={i} className="text-[15px] leading-[1.55] text-encre">
                    {e.avant}
                    <mark className="rounded-[3px] bg-rose px-0.5 text-encre">{e.trouve}</mark>
                    {e.apres}
                  </span>
                ))}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PageCoach>
  );
}
