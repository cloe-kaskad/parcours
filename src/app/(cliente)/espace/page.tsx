import Link from "next/link";
import { CarteRessource } from "@/components/espace/CarteRessource";
import { CarteSeance } from "@/components/espace/CarteSeance";
import { Couverture } from "@/components/espace/Couverture";
import { EntreeCarnet } from "@/components/espace/EntreeCarnet";
import { GesteEcrire } from "@/components/espace/GesteEcrire";
import { Bandeau } from "@/components/espace/Bandeau";
import { Pied } from "@/components/espace/Pied";
import { ProchaineSeance } from "@/components/espace/ProchaineSeance";
import { TraceChemin } from "@/components/espace/TraceChemin";
import { debutDuParcours } from "@/lib/chemin";
import { ZoneLettre } from "@/components/espace/ZoneLettre";
import { ZoneMeteo } from "@/components/espace/ZoneMeteo";
import { exigerCliente } from "@/lib/auth";
import { avantOuverture, jourEtMois, jourEtMoisCourt, prochaineSeance } from "@/lib/dates";
import { urlCouverture } from "@/lib/couvertures";
import { cartesRessources, entreesCarnet, lettreEnCours, mesNotesEmilien, mesSeances, meteoDuJour, monParcours } from "@/lib/db/cliente";
import { lireLettre } from "@/lib/lettre";
import type { Seance } from "@/lib/supabase/types";
import { origineEntree } from "@/lib/ressources";
import { extrait, titrePropre } from "@/lib/textes";

export const metadata = { title: "Ton espace" };

const nomStation = (s: Seance) => s.station_validee ?? s.mots_cles[0] ?? null;

export default async function MonEspace() {
  const profil = await exigerCliente();
  const parcours = await monParcours(profil.id);
  const [{ etats, meteo, traces, musiques }, seances, enCours, carnet, cartes, notes] = await Promise.all([
    meteoDuJour(profil.id),
    parcours ? mesSeances(parcours.id) : Promise.resolve([]),
    parcours ? lettreEnCours(parcours.id, profil.id) : Promise.resolve(null),
    entreesCarnet(profil.id, 3),
    parcours ? cartesRessources(parcours.id, profil.id) : Promise.resolve([]),
    mesNotesEmilien(profil.id),
  ]);

  const faites = seances.filter((s) => s.statut === "faite");
  const derniere = faites.at(-1);
  const prochaine = prochaineSeance(seances);
  const point = derniere && prochaine ? `entre la séance ${derniere.numero} et la séance ${prochaine.numero}` : null;
  const memoire = [...faites].reverse();
  const nomDe = (code: string) => etats.find((e) => e.code === code)?.libelle ?? "";

  const carteSeance = (s: Seance) => (
    <CarteSeance key={s.id} numero={s.numero} date={s.date} mots={s.mots_cles} lien={s.transcript_formate || s.transcript_pdf_path || s.transcript_segments ? `/espace/seance/${s.id}` : null} />
  );

  return (
    <>
      <Bandeau prenom={profil.prenom} />

      <Couverture url={urlCouverture(parcours?.couverture_path ?? null)} prenom={profil.prenom} />
      <TraceChemin debut={debutDuParcours(parcours?.date_debut, seances)} stations={faites.map((s) => ({ id: s.id, nom: nomStation(s) }))} graine={parcours?.id ?? profil.id} />

      <div className="entree-reste flex flex-1 flex-col">
        <div className="bg-violet-nuit md:grid md:grid-cols-2 md:gap-20 md:px-10 md:pb-14 md:pt-12">
          <section className="px-[22px] pb-9 pt-2.5 md:self-start md:p-0">
            <ProchaineSeance date={prochaine?.date ?? null} point={point} />
          </section>
          <section className="bg-violet px-[22px] pb-9 pt-10 md:bg-transparent md:p-0">
            <ZoneMeteo
              etats={etats}
              etatInitial={meteo?.etat_code ?? null}
              noteInitiale={meteo?.note ?? ""}
              musiques={musiques}
              traces={traces.map((t) => `${nomDe(t.etat_code)} · ${jourEtMoisCourt(t.date)}`)}
            />
          </section>
        </div>

        <div className="mx-auto w-full max-w-[1280px] md:grid md:grid-cols-[7fr_5fr] md:gap-10 md:px-10 md:pt-14">
          <section className="px-3.5 pt-2.5 md:self-start md:p-0">
            {enCours ? (
              <ZoneLettre
                titre={titrePropre(enCours.lettre.titre)}
                date={enCours.lettre.publiee_at && !avantOuverture(enCours.lettre.publiee_at) ? jourEtMois(enCours.lettre.publiee_at) : null}
                debut={extrait(lireLettre(enCours.lettre.contenu).preambule || enCours.lettre.intro)}
                exercices={enCours.exercices.map((e, i) => ({ id: e.id, titre: titrePropre(e.titre) || `Exercice ${i + 1}`, ecrit: enCours.ecrits.has(e.id) }))}
                lien={`/espace/lettre/${enCours.lettre.id}`}
              />
            ) : (
              <p className="px-2 font-italique text-[15px] italic text-creme/70">Ta prochaine lettre arrivera ici, après la séance.</p>
            )}
          </section>

          <section className="flex flex-col gap-[18px] px-[22px] pb-2.5 pt-11 md:p-0">
            <GesteEcrire pastille entete={<h2 className="t-zone text-creme">ton carnet</h2>} />
            {carnet.length ? (
              <div className="flex flex-col gap-2.5">
                {carnet.map((e, i) => (
                  <EntreeCarnet key={e.id} id={e.id} date={e.date} contenu={e.contenu} aAborder={e.pour_prochaine_seance} origine={origineEntree(e)} decalee={i % 2 === 1} coupee />
                ))}
              </div>
            ) : (
              <p className="t-lecture text-creme/70">Rien pour l’instant. Ce que tu écris ici reste dans ton carnet.</p>
            )}
            <Link href="/espace/carnet" className="t-action self-start py-1 text-[16px] text-rose">
              Tout le carnet →
            </Link>
          </section>
        </div>

        {cartes.length ? (
          <section className="mx-auto flex w-full max-w-[1280px] flex-col gap-[18px] pb-2.5 pt-11 md:gap-6 md:px-10 md:pt-[72px]">
            <h2 className="t-zone px-[22px] text-creme md:px-0">pour toi</h2>
            <div className="defile">
              {cartes.map(({ a, r, lien, statut }) => (
                <CarteRessource key={a.id} affectationId={a.id} type={r.type} titre={r.titre} auteur={r.auteur} mot={a.pourquoi} image={r.image_url} lien={lien} statut={statut} />
              ))}
            </div>
            <Link href="/espace/ressources" className="t-action self-start px-[22px] py-1 text-[16px] text-rose md:px-0">
              Toutes les ressources →
            </Link>
          </section>
        ) : null}

        {memoire.length || notes.length ? (
          <section className="mx-auto flex w-full max-w-[1280px] flex-col gap-[18px] px-[22px] pb-11 pt-11 md:px-10 md:pt-[72px]">
            <h2 className="t-zone text-creme">mémoire</h2>
            {notes.map((n) =>
              n.url ? (
                <a key={n.id} href={n.url} target="_blank" rel="noreferrer" className="papier flex flex-col gap-1 p-[18px]">
                  <span className="font-italique text-[14px] italic text-violet">Une note d’Émilien pour toi</span>
                  <span className="t-carte">{n.titre}</span>
                </a>
              ) : null,
            )}
            <div className="flex flex-col border-b border-[var(--filet-violet)]">
              {memoire.slice(0, 4).map(carteSeance)}
              {memoire.length > 4 ? (
                <details className="group">
                  <summary className="t-action min-h-[44px] cursor-pointer border-t border-[var(--filet-violet)] py-4 text-[16px] text-rose group-open:hidden">Les séances d’avant →</summary>
                  {memoire.slice(4).map(carteSeance)}
                </details>
              ) : null}
            </div>
          </section>
        ) : null}

        <Pied />
      </div>
    </>
  );
}
