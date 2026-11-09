import Link from "next/link";
import { Barre, Colonne, PageCoach } from "@/components/coach/base";
import { exigerEquipe } from "@/lib/auth";
import { listeClientes } from "@/lib/db/coach";

export const metadata = { title: "Clientes" };

export default async function Clientes() {
  const profil = await exigerEquipe();
  const clientes = await listeClientes();
  const actives = clientes.filter((c) => c.actif);
  const autres = clientes.filter((c) => !c.actif);
  const Ligne = ({ c }: { c: (typeof clientes)[number] }) => (
    <Link href={`/coach/clientes/${c.id}`} className="flex items-baseline justify-between gap-3 border-t border-[var(--filet-papier)] py-4">
      <span className="font-titre text-[22px] font-semibold leading-none">
        {c.prenom} {c.nom}
      </span>
      <span className="shrink-0 text-[12px] text-violet/80">{c.vecues ? `${c.vecues} séance${c.vecues > 1 ? "s" : ""} vécue${c.vecues > 1 ? "s" : ""}` : "pas encore de séance"}</span>
    </Link>
  );
  return (
    <PageCoach>
      <Barre retour={profil.role === "relecteur" ? { href: "/emilien", libelle: "À lire" } : { href: "/coach", libelle: "Agenda" }} />
      <Colonne className="pb-14 pt-8">
        <div className="flex items-end justify-between gap-3">
          <h1 className="t-page-violet text-violet">clientes</h1>
          {profil.role === "coach" ? (
            <Link href="/coach/clientes/nouvelle" className="bouton-rouge inline-flex items-center">
              Nouvelle
            </Link>
          ) : null}
        </div>
        <div className="flex flex-col pt-7">
          {actives.map((c) => (
            <Ligne key={c.id} c={c} />
          ))}
        </div>
        {autres.length ? (
          <div className="flex flex-col pt-8 opacity-60">
            <p className="pb-2 font-italique text-[14px] italic text-violet">En retrait</p>
            {autres.map((c) => (
              <Ligne key={c.id} c={c} />
            ))}
          </div>
        ) : null}
      </Colonne>
    </PageCoach>
  );
}
