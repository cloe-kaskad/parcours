import { Bandeau } from "@/components/espace/Bandeau";
import { CarteRessource } from "@/components/espace/CarteRessource";
import { EnteteSousPage } from "@/components/espace/EnteteSousPage";
import { FiltresRessources } from "@/components/espace/FiltresRessources";
import { exigerCliente } from "@/lib/auth";
import { cartesRessources, monParcours } from "@/lib/db/cliente";
import { libelleType, ORDRE_FILTRES } from "@/lib/ressources";

export const metadata = { title: "Pour toi" };

export default async function Ressources() {
  const profil = await exigerCliente();
  const parcours = await monParcours(profil.id);
  const cartes = parcours ? await cartesRessources(parcours.id, profil.id) : [];
  const presents = new Set(cartes.map(({ r }) => libelleType(r.type)));

  return (
    <>
      <Bandeau prenom={profil.prenom} />
      <div className="px-[22px] md:px-10">
        <EnteteSousPage />
        <header className="flex flex-col gap-2 pt-[30px]">
          <h1 className="t-page-violet text-creme">pour toi</h1>
          <p className="font-italique text-[15px] italic text-rose">Ce que j’ai choisi pour toi, et pourquoi.</p>
        </header>
      </div>
      {cartes.length ? (
        <FiltresRessources
          filtres={ORDRE_FILTRES.filter((f) => presents.has(f))}
          cartes={cartes.map(({ a, r, lien, statut }) => ({
            id: a.id,
            filtre: libelleType(r.type),
            contenu: <CarteRessource pleine affectationId={a.id} type={r.type} titre={r.titre} auteur={r.auteur} mot={a.pourquoi} image={r.image_url} lien={lien} statut={statut} />,
          }))}
        />
      ) : (
        <p className="t-lecture px-[22px] pt-9 text-creme/70">Rien pour l’instant. Cloé déposera ici ce qu’elle choisit pour toi.</p>
      )}
    </>
  );
}
