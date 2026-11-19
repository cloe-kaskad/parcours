import Link from "next/link";
import { redirect } from "next/navigation";
import { Marque, PageCoach, Points, TitreSection } from "@/components/coach/base";
import { Barre } from "@/components/coach/Entete";
import { FormAction } from "@/components/coach/interactifs";
import { Calendrier } from "@/components/espace/Calendrier";
import { creerLettre } from "@/lib/actions/lettres";
import { creerSeance, enregistrerDate } from "@/lib/actions/seances";
import { estAVenir, nomSemaine, phraseRetards, type EtatSeance } from "@/lib/agenda";
import { aConfirmer, avantOuverture, jourEtMoisCourt } from "@/lib/dates";
import { getProfil } from "@/lib/supabase/server";
import { chargerAgenda } from "@/lib/db/coach";

export const metadata = { title: "Agenda" };

const heure = (d: string) => new Intl.DateTimeFormat("fr-FR", { hour: "numeric", timeZone: "Europe/Paris" }).format(new Date(d)).replace(" ", "");
const jourCourt = (d: string) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "Europe/Paris" }).format(new Date(d));

type Ligne = { seance: { id: string; numero: number; date: string | null; parcours_id: string }; cliente: { id: string; prenom: string }; etat: EtatSeance; pause: boolean };

// L'action attendue d'une ligne, une seule : déposer l'audio, écrire la lettre, préparer la séance.
function Action({ l, avenir, aDeposer = false }: { l: Ligne; avenir: boolean; aDeposer?: boolean }) {
  const seance = `/coach/clientes/${l.cliente.id}/seances/${l.seance.id}`;
  const classe = (rouge: boolean) => `${rouge ? "bouton-rouge" : "bouton-fantome"} inline-flex shrink-0 items-center !px-4 !text-[15px]`;
  // L'heure est passée : déposer l'audio dit qu'elle a eu lieu.
  if (aDeposer)
    return (
      <Link href={`${seance}#audio`} className={classe(true)}>
        Déposer l’audio
      </Link>
    );
  if (avenir)
    return (
      <Link href={`${seance}/avant`} className={classe(false)}>
        Préparer
      </Link>
    );
  // Les séances reprises de Notion (datées d'avant l'ouverture) n'attendent plus rien : leurs points suffisent.
  if (l.seance.date && avantOuverture(l.seance.date)) return <Points points={l.etat.points} />;
  if (!l.etat.transcript)
    return (
      <Link href={seance} className={classe(l.etat.retard)}>
        Déposer
      </Link>
    );
  if (!l.etat.exercices)
    return (
      <form action={creerLettre} className="contents">
        <input type="hidden" name="parcours_id" value={l.seance.parcours_id} />
        <input type="hidden" name="cliente_id" value={l.cliente.id} />
        <input type="hidden" name="seance_id" value={l.seance.id} />
        <button type="submit" className={classe(l.etat.retard)}>
          Écrire
        </button>
      </form>
    );
  return <Points points={l.etat.points} />;
}

// Une ligne de l'agenda : le prénom ouvre la fiche, le bouton à droite est l'action attendue.
function LigneAgenda({ l, sousTitre, marque, avenir = false, aDeposer = false }: { l: Ligne; sousTitre: string; marque: string | null; avenir?: boolean; aDeposer?: boolean }) {
  const retard = (l.etat.retard && !avenir) || aDeposer;
  return (
    <div className={`flex items-center gap-3 border-t border-[var(--filet-papier)] py-3.5 ${l.pause ? "opacity-55" : ""}`}>
      {l.seance.date ? <Calendrier date={l.seance.date} surPapier retard={retard} /> : null}
      <Link href={`/coach/clientes/${l.cliente.id}`} className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-titre text-[19px] font-semibold leading-none text-encre">
          {l.cliente.prenom} <span className="font-normal opacity-60">· séance {l.seance.numero}</span>
        </span>
        <span className={`text-[14px] ${retard ? "font-medium text-rouge" : "text-violet"}`}>{sousTitre}</span>
        {marque ? <Marque className="self-start">{marque}</Marque> : null}
      </Link>
      <Action l={l} avenir={avenir} aDeposer={aDeposer} />
    </div>
  );
}

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
  const aFaire = (l: (typeof lignes)[number]) => {
    if (l.seance.date && avantOuverture(l.seance.date)) return "reprise de Notion";
    if (!l.etat.transcript) return l.etat.retard ? l.etat.libelle : "transcript à déposer";
    if (!l.etat.exercices) return l.etat.retard ? l.etat.libelle.replace("exercices à écrire", "pratiques à écrire") : "pratiques à écrire";
    return l.etat.emilien ? "tout est fait" : "Émilien à prévenir";
  };

  const retards = lignes.filter((l) => l.seance.statut === "faite" && l.etat.retard && !l.pause);
  // Planifiées dont l'heure est passée : ni à venir, ni faites. En tête, avec « Déposer l'audio ».
  const aDeposer = lignes.filter((l) => aConfirmer(l.seance));
  const aVenir = lignes.filter((l) => l.seance.statut === "planifiee" && l.seance.date && estAVenir(l.seance.date));
  // Une séance vécue depuis l'ouverture qui attend encore quelque chose reste en tête, même sans retard.
  const enAttente = (l: (typeof lignes)[number]) => l.seance.statut === "faite" && !l.pause && !l.etat.retard && Boolean(l.seance.date) && !avantOuverture(l.seance.date!) && !(l.etat.transcript && l.etat.exercices);
  const aFaireSansRetard = lignes.filter(enAttente);
  const passees = lignes.filter((l) => l.seance.statut === "faite" && l.seance.date && !l.etat.retard && !enAttente(l)).reverse();
  const aDater = lignes.filter((l) => !l.seance.date);
  const semaines = ["Cette semaine", "La semaine prochaine", "Plus tard"].map((nom) => ({ nom, lignes: aVenir.filter((l) => nomSemaine(l.seance.date!) === nom) })).filter((s) => s.lignes.length);

  return (
    <PageCoach>
      <Barre />

      <div className="mx-auto w-full max-w-[1120px] px-[22px] md:px-10">
        <div className="flex flex-col gap-2 pt-8">
          <h1 className="m-0 font-titre text-[38px] font-semibold leading-none tracking-[-0.03em] text-violet md:text-[60px]">Bonjour {profil.prenom}</h1>
          <p className={`m-0 font-titre text-[17px] font-semibold ${retards.length ? "text-rouge" : "text-violet"}`}>{phraseRetards(retards.length)}</p>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-x-[70px]">
          <div className="flex flex-col">
            {aDeposer.length || retards.length || aFaireSansRetard.length ? (
              <section className="flex flex-col pt-8">
                <TitreSection className="pb-2.5">Il reste à faire</TitreSection>
                {aDeposer.map((l) => (
                  <LigneAgenda key={l.seance.id} l={l} aDeposer sousTitre={`${jourCourt(l.seance.date!)} ${heure(l.seance.date!)} · a eu lieu ? audio à déposer`} marque={marque(l.cliente.id)} />
                ))}
                {[...retards, ...aFaireSansRetard].map((l) => (
                  <LigneAgenda key={l.seance.id} l={l} sousTitre={aFaire(l)} marque={marque(l.cliente.id)} />
                ))}
              </section>
            ) : null}

            {semaines.map((s) => (
              <section key={s.nom} className="flex flex-col pt-10">
                <TitreSection className="pb-2.5">{s.nom}</TitreSection>
                {s.lignes.map((l) => (
                  <LigneAgenda key={l.seance.id} l={l} avenir sousTitre={`${jourCourt(l.seance.date!)} ${heure(l.seance.date!)}`} marque={marque(l.cliente.id)} />
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
              <details className="group flex flex-col pt-10">
                <summary className="flex min-h-[44px] cursor-pointer items-center justify-between pb-2.5 font-titre text-[22px] font-semibold tracking-[-0.02em]">
                  Passées ({passees.length})
                  <span className="text-[14px] text-violet group-open:hidden">déplier</span>
                  <span className="hidden text-[14px] text-violet group-open:inline">replier</span>
                </summary>
                {passees.map((l) => (
                  <LigneAgenda key={l.seance.id} l={l} sousTitre={aFaire(l)} marque={marque(l.cliente.id)} />
                ))}
              </details>
            ) : null}

            {aDater.length ? (
              <details className="group flex flex-col pt-10">
                <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-titre text-[22px] font-semibold tracking-[-0.02em]">
                  À dater ({aDater.length})
                  <span className="text-[14px] text-violet group-open:hidden">déplier</span>
                  <span className="hidden text-[14px] text-violet group-open:inline">replier</span>
                </summary>
                <p className="pb-2 text-[14px] text-violet/80">Ces séances viennent de Notion, sans date. La date s’affiche ensuite chez ta cliente.</p>
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
