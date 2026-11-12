import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/espace/Logo";
import { Deconnexion } from "@/components/Deconnexion";
import { LigneSeance, PageCoach, Points, TitreSection } from "@/components/coach/base";
import { FormAction } from "@/components/coach/interactifs";
import { creerSeance, enregistrerDate } from "@/lib/actions/seances";
import { aujourdhuiLong, estAVenir, nomSemaine, phraseRetards } from "@/lib/agenda";
import { jourEtMoisCourt } from "@/lib/dates";
import { getProfil } from "@/lib/supabase/server";
import { chargerAgenda } from "@/lib/db/coach";

export const metadata = { title: "Agenda" };

const heure = (d: string) => new Intl.DateTimeFormat("fr-FR", { hour: "numeric", timeZone: "Europe/Paris" }).format(new Date(d)).replace(" ", "");
const jourCourt = (d: string) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "Europe/Paris" }).format(new Date(d));

export default async function Agenda() {
  const profil = (await getProfil())!;
  if (profil.role === "relecteur") redirect("/emilien");
  const { lignes, choix, aEcrit } = await chargerAgenda();
  // La marque « a écrit » se pose une fois par cliente, sur sa première ligne à l'écran.
  const marquees = new Set<string>();
  const marque = (clienteId: string) => {
    const d = aEcrit.get(clienteId);
    if (!d || marquees.has(clienteId)) return null;
    marquees.add(clienteId);
    return `a écrit · ${jourEtMoisCourt(d)}`;
  };
  const lienSeance = (l: (typeof lignes)[number]) => `/coach/clientes/${l.cliente.id}/seances/${l.seance.id}`;

  const retards = lignes.filter((l) => l.seance.statut === "faite" && l.etat.retard && !l.pause);
  const aVenir = lignes.filter((l) => l.seance.statut === "planifiee" && l.seance.date && estAVenir(l.seance.date));
  const passees = lignes.filter((l) => l.seance.statut === "faite" && l.seance.date && !l.etat.retard).reverse();
  const aDater = lignes.filter((l) => !l.seance.date);
  const semaines = ["Cette semaine", "La semaine prochaine", "Plus tard"].map((nom) => ({ nom, lignes: aVenir.filter((l) => nomSemaine(l.seance.date!) === nom) })).filter((s) => s.lignes.length);

  return (
    <PageCoach>
      <header className="flex items-center justify-between gap-4 bg-violet px-[22px] py-3.5 md:px-10">
        <Logo couleur="blanc" hauteur={34} />
        <nav className="flex flex-wrap items-center justify-end gap-x-4">
          <Link href="/coach/clientes" className="t-action inline-flex min-h-[44px] items-center text-[14px] text-creme">
            Clientes
          </Link>
          <Link href="/coach/ressources" className="t-action inline-flex min-h-[44px] items-center text-[14px] text-creme">
            Bibliothèque
          </Link>
          <Deconnexion className="text-creme/70" />
        </nav>
      </header>

      <div className="mx-auto w-full max-w-[1200px] px-[22px] md:px-10">
        <div className="flex flex-col gap-2 pt-8">
          <h1 className="t-page text-violet">Bonjour {profil.prenom}</h1>
          <p className="font-italique text-[15px] italic text-violet">{aujourdhuiLong()}</p>
          <p className={`pt-1.5 font-titre text-[18px] font-semibold ${retards.length ? "text-rouge" : "text-violet"}`}>{phraseRetards(retards.length)}</p>
        </div>

        <div className="md:grid md:grid-cols-[7fr_5fr] md:gap-16">
          <div className="flex flex-col">
            {retards.length ? (
              <section className="flex flex-col pt-8">
                <TitreSection className="pb-2.5">Il reste à faire</TitreSection>
                {retards.map((l) => (
                  <LigneSeance key={l.seance.id} href={lienSeance(l)} date={l.seance.date} retardee prenom={l.cliente.prenom} numero={l.seance.numero} libelle={l.etat.libelle} marque={marque(l.cliente.id)} droite={<Points points={l.etat.points} />} />
                ))}
              </section>
            ) : null}

            {semaines.map((s) => (
              <section key={s.nom} className="flex flex-col pt-10">
                <TitreSection className="pb-2.5">{s.nom}</TitreSection>
                {s.lignes.map((l) => (
                  <LigneSeance
                    key={l.seance.id}
                    href={`${lienSeance(l)}/avant`}
                    date={l.seance.date}
                    prenom={l.cliente.prenom}
                    numero={l.seance.numero}
                    libelle={`${jourCourt(l.seance.date!)} ${heure(l.seance.date!)}`}
                    marque={marque(l.cliente.id)}
                    droite={<span className="t-action shrink-0 text-[14px] text-rouge">Avant la séance →</span>}
                  />
                ))}
              </section>
            ))}

            <section className="flex flex-col gap-3 pt-11">
              <details className="group">
                <summary className="bouton-rouge inline-flex cursor-pointer items-center group-open:hidden">Nouvelle séance</summary>
              <FormAction action={creerSeance} bouton="Créer la séance" rouge>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="etiquette">
                    avec
                    <select name="parcours_id" className="champ">
                      {choix.map((c) => (
                        <option key={c.parcoursId} value={c.parcoursId}>
                          {c.prenom}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="etiquette">
                    date et heure
                    <input type="datetime-local" name="date" className="champ" />
                  </label>
                </div>
              </FormAction>
              </details>
            </section>
          </div>

          <div className="flex flex-col">
            {passees.length ? (
              <section className="flex flex-col pt-10">
                <TitreSection className="pb-2.5">Passées</TitreSection>
                {passees.map((l) => (
                  <LigneSeance key={l.seance.id} href={lienSeance(l)} date={l.seance.date} prenom={l.cliente.prenom} numero={l.seance.numero} libelle={l.etat.libelle} marque={marque(l.cliente.id)} estompee={l.pause} droite={<Points points={l.etat.points} />} />
                ))}
              </section>
            ) : null}

            {aDater.length ? (
              <details className="group flex flex-col pt-10">
                <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-titre text-[22px] font-semibold tracking-[-0.02em]">
                  À dater ({aDater.length})
                  <span className="text-[13px] text-violet group-open:hidden">déplier</span>
                  <span className="hidden text-[13px] text-violet group-open:inline">replier</span>
                </summary>
                <p className="pb-2 text-[13px] text-violet/80">Ces séances viennent de Notion, sans date. La date s’affiche ensuite chez ta cliente.</p>
                {aDater.map((l) => (
                  <div key={l.seance.id} className="flex flex-col gap-2 border-t border-[var(--filet-papier)] py-3">
                    <Link href={lienSeance(l)} className="font-titre text-[18px] font-semibold leading-none">
                      {l.cliente.prenom} <span className="font-normal opacity-60">· séance {l.seance.numero}</span>
                    </Link>
                    <FormAction action={enregistrerDate} bouton="OK" className="flex-row items-end">
                      <input type="hidden" name="id" value={l.seance.id} />
                      <input type="datetime-local" name="date" aria-label={`Date de la séance ${l.seance.numero} de ${l.cliente.prenom}`} className="champ min-w-0 flex-1 sm:max-w-[260px]" />
                    </FormAction>
                  </div>
                ))}
              </details>
            ) : null}
          </div>
        </div>

        <div className="py-10" />
      </div>
    </PageCoach>
  );
}
