import { Bandeau } from "@/components/espace/Bandeau";
import { EnteteSousPage } from "@/components/espace/EnteteSousPage";
import { EntreeCarnet } from "@/components/espace/EntreeCarnet";
import { GesteEcrire } from "@/components/espace/GesteEcrire";
import { exigerCliente } from "@/lib/auth";
import { jourEtMois, prochaineSeance } from "@/lib/dates";
import { entreesCarnet, mesSeances, monParcours, type EntreeCarnetComplete } from "@/lib/db/cliente";
import { origineEntree } from "@/lib/ressources";

export const metadata = { title: "Ton carnet" };

function Entree({ e, bordure = false }: { e: EntreeCarnetComplete; bordure?: boolean }) {
  return <EntreeCarnet id={e.id} date={e.date} contenu={e.contenu} aAborder={e.pour_prochaine_seance} origine={origineEntree(e)} bordure={bordure} />;
}

export default async function Carnet() {
  const profil = await exigerCliente();
  const parcours = await monParcours(profil.id);
  const [entrees, seances] = await Promise.all([entreesCarnet(profil.id), parcours ? mesSeances(parcours.id) : Promise.resolve([])]);
  const prochaine = prochaineSeance(seances);
  const aAborder = entrees.filter((e) => e.pour_prochaine_seance);
  const reste = entrees.filter((e) => !e.pour_prochaine_seance);

  return (
    <>
      <Bandeau prenom={profil.prenom} />
      <div className="mx-auto flex w-full max-w-[720px] flex-col px-[22px] pb-[60px]">
        <EnteteSousPage />
        <div className="pt-9">
          <GesteEcrire pastille choixAborder placeholder="Ce qui t’arrive, comme ça vient." entete={<h1 className="t-page-violet text-creme">ton carnet</h1>} />
        </div>

        {aAborder.length ? (
          <section className="flex flex-col gap-3 pt-9">
            <h2 className="font-italique text-[14px] italic text-rose">{prochaine?.date ? `À aborder le ${jourEtMois(prochaine.date)}` : "À aborder en séance"}</h2>
            {aAborder.map((e) => (
              <Entree key={e.id} e={e} bordure />
            ))}
          </section>
        ) : null}

        {reste.length ? (
          <section className="flex flex-col gap-3 pt-10">
            <h2 className="font-italique text-[14px] italic text-rose">Depuis le début</h2>
            {reste.map((e) => (
              <Entree key={e.id} e={e} />
            ))}
          </section>
        ) : null}

        {!entrees.length ? <p className="t-lecture pt-9 text-creme/70">Rien pour l’instant. Ce que tu écris ici reste dans ton carnet.</p> : null}
      </div>
    </>
  );
}
