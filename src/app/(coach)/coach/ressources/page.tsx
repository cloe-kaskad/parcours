import Image from "next/image";
import { Barre, Colonne, PageCoach } from "@/components/coach/base";
import { ColleUnLien, GrilleBibliotheque, ModifierRessource, PartagerAvec } from "@/components/coach/Bibliotheque";
import { Logo } from "@/components/espace/Logo";
import { validerProposition } from "@/lib/actions/ressources";
import { exigerEquipe } from "@/lib/auth";
import { chargerBibliotheque } from "@/lib/db/coach";
import { urlSignee } from "@/lib/fichiers";
import { libelleType } from "@/lib/ressources";
import { titrePropre } from "@/lib/textes";

export const metadata = { title: "Bibliothèque" };

export default async function Bibliotheque() {
  const profil = await exigerEquipe();
  const estCoach = profil.role === "coach";
  const { ressources, choix } = await chargerBibliotheque();
  const cartes = await Promise.all(
    ressources.map(async (r) => {
      const lien = r.url ?? (r.fichier_path ? await urlSignee("ressources", r.fichier_path) : null);
      return {
        id: r.id,
        type: r.type,
        contenu: (
          <article className="flex flex-col overflow-hidden rounded-[4px] border border-violet/18">
            {r.image_url ? <Image src={r.image_url} alt="" width={346} height={150} unoptimized className="h-[150px] w-full object-cover" /> : null}
            <div className="flex flex-col gap-[7px] px-[18px] pb-[18px] pt-4">
              <p className="font-titre text-[11px] font-semibold uppercase tracking-[0.08em] text-rouge">{libelleType(r.type)}</p>
              <h2 className="t-carte text-[20px]! [overflow-wrap:anywhere]">
                {lien ? (
                  <a href={lien} target="_blank" rel="noreferrer">
                    {titrePropre(r.titre)}
                  </a>
                ) : (
                  titrePropre(r.titre)
                )}
              </h2>
              {r.auteur ? <p className="text-[13px] text-encre/70">{r.auteur}</p> : null}
              {r.description ? <p className="line-clamp-4 pt-1 font-italique text-[14px] italic leading-[1.5] text-violet">{r.description}</p> : null}
              <div className="flex flex-wrap items-center justify-between gap-x-4 pt-1.5">
                {estCoach ? (
                  <div className="flex gap-4">
                    <PartagerAvec ressourceId={r.id} choix={choix} />
                    <ModifierRessource r={r} />
                  </div>
                ) : null}
                {r.en_attente && estCoach ? (
                  <form action={validerProposition} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <span className="font-italique text-[12px] italic text-violet">proposée par Émilien · en attente</span>
                    <button type="submit" className="t-action min-h-[44px] text-[13px] text-rouge">
                      Garder
                    </button>
                  </form>
                ) : r.partages.length ? (
                  <span className="font-italique text-[12px] italic text-violet">partagée avec {r.partages.join(", ")}</span>
                ) : null}
              </div>
            </div>
          </article>
        ),
      };
    }),
  );

  return (
    <PageCoach>
      <Barre retour={estCoach ? { href: "/coach", libelle: "Agenda" } : { href: "/emilien", libelle: "À lire" }} droite={<Logo couleur="blanc" hauteur={30} />} />
      <Colonne className="max-w-5xl pt-[30px]">
        <div className="flex flex-col gap-2">
          <h1 className="t-page-violet text-violet">bibliothèque</h1>
          <p className="font-italique text-[15px] italic text-violet">Tout ce que tu as rassemblé, à partager cliente par cliente.</p>
          {estCoach ? <ColleUnLien /> : null}
        </div>
        <GrilleBibliotheque cartes={cartes} />
      </Colonne>
    </PageCoach>
  );
}
