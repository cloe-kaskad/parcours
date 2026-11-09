import Link from "next/link";
import { notFound } from "next/navigation";
import { Barre, Colonne, LienRose, PageCoach } from "@/components/coach/base";
import { Preparation } from "@/components/coach/Preparation";
import { Calendrier } from "@/components/espace/Calendrier";
import { TexteLettre } from "@/components/espace/TexteLettre";
import { exigerEquipe } from "@/lib/auth";
import { avantOuverture, jourEtHeure, jourEtMois, jourEtMoisCourt } from "@/lib/dates";
import { chargerAvant, texteSeance } from "@/lib/db/coach";
import { titrePropre } from "@/lib/textes";
import type { JournalEntree } from "@/lib/supabase/types";

export const metadata = { title: "Avant la séance" };

const SUIVIS = { a_voir: "à découvrir", commence: "commencé", termine: "terminé" };

function Bloc({ titre, children, rouge = false }: { titre: string; children: React.ReactNode; rouge?: boolean }) {
  return (
    <section className="flex flex-col gap-2.5 border-t border-[var(--filet-papier)] py-[22px] first:border-t-0 first:pt-0">
      <h2 className={`font-titre text-[20px] font-semibold leading-none ${rouge ? "text-rouge" : ""}`}>{titre}</h2>
      {children}
    </section>
  );
}

function Replie({ titre, ouvert = false, children }: { titre: string; ouvert?: boolean; children: React.ReactNode }) {
  return (
    <details className="group flex flex-col gap-2.5 border-t border-[var(--filet-papier)] py-[22px]" open={ouvert}>
      <summary className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3">
        <span className="font-titre text-[20px] font-semibold leading-none">{titre}</span>
        <span className="t-action shrink-0 text-[13px] text-violet group-open:hidden">déplier</span>
        <span className="t-action hidden shrink-0 text-[13px] text-violet group-open:inline">replier</span>
      </summary>
      <div className="flex flex-col gap-2 pt-2">{children}</div>
    </details>
  );
}

function Entree({ e, chaude = false }: { e: JournalEntree; chaude?: boolean }) {
  const date = avantOuverture(e.date) ? null : jourEtMois(e.date);
  return (
    <div className={`flex flex-col gap-1.5 rounded-[4px] border border-violet/18 px-4 py-3.5 ${chaude ? "border-l-[3px] border-l-rouge" : ""}`}>
      {date ? <p className="font-italique text-[13px] italic text-violet">{date}</p> : null}
      <p className="whitespace-pre-line text-[16px] leading-[1.55]">{e.contenu}</p>
    </div>
  );
}

export default async function AvantLaSeance({ params }: PageProps<"/coach/clientes/[id]/seances/[seanceId]/avant">) {
  const profil = await exigerEquipe();
  const { id, seanceId } = await params;
  const estCoach = profil.role === "coach";
  const d = await chargerAvant(seanceId, estCoach);
  if (!d || d.cliente.id !== id) notFound();
  const { seance, cliente, precedente, carnet, meteos, etats, lettre, retours, affectations, suivis, ressources, preparation } = d;
  const aAborder = carnet.filter((e) => e.pour_prochaine_seance);
  const depuis = precedente?.date?.slice(0, 10);
  const reste = carnet.filter((e) => !e.pour_prochaine_seance && (!depuis || e.date >= depuis));
  const texte = precedente ? texteSeance(precedente) : "";
  const libelle = (code: string) => etats.find((x) => x.code === code)?.libelle ?? code;

  return (
    <PageCoach>
      <Barre retour={{ href: "/coach", libelle: "Agenda" }} droite={<LienRose href={`/coach/clientes/${id}`}>Fiche de {cliente.prenom}</LienRose>} />
      <Colonne className="pb-16">
        <header className="flex items-center gap-4 pt-[30px]">
          {seance.date ? <Calendrier date={seance.date} prochaine surPapier retard /> : null}
          <div className="flex flex-col gap-1">
            <p className="font-italique text-[13px] italic text-violet">Avant la séance</p>
            <h1 className="font-titre text-[34px] font-semibold leading-[0.95] tracking-[-0.03em] text-violet">
              {cliente.prenom} · séance {seance.numero}
            </h1>
            {seance.date ? <p className="text-[14px] text-violet/80">{jourEtHeure(seance.date)}</p> : null}
          </div>
        </header>

        <div className="flex flex-col pt-[26px]">
          <Bloc titre="Ce qu’elle veut aborder" rouge>
            {aAborder.length ? aAborder.map((e) => <Entree key={e.id} e={e} chaude />) : <p className="text-[16px] text-encre/70">Rien de marqué pour l’instant.</p>}
          </Bloc>

          {reste.length ? (
            <Bloc titre={precedente?.date ? `Le reste de son carnet depuis le ${jourEtMois(precedente.date)}` : "Le reste de son carnet"}>
              {reste.map((e) => (
                <Entree key={e.id} e={e} />
              ))}
            </Bloc>
          ) : null}

          {meteos.length ? (
            <Bloc titre="Ses météos">
              <p className="text-[14px]">{meteos.map((m) => `${libelle(m.etat_code)} · ${jourEtMoisCourt(m.date)}`).join("   ")}</p>
            </Bloc>
          ) : null}

          {lettre ? (
            <Replie titre={`La lettre envoyée · ${titrePropre(lettre.titre)}`}>
              <TexteLettre>{lettre.contenu || lettre.intro}</TexteLettre>
              <Link href={`/coach/clientes/${id}/lettre/${lettre.id}`} className="t-action text-[14px] text-violet">
                Ouvrir la lettre →
              </Link>
            </Replie>
          ) : null}

          {retours.length ? (
            <Replie titre="Le retour d’Émilien" ouvert>
              {retours.map((r) => (
                <p key={r.id} className="whitespace-pre-line font-italique text-[15px] italic leading-[1.55] text-violet">
                  {r.contenu}
                </p>
              ))}
            </Replie>
          ) : null}

          {precedente ? (
            <Replie titre={`Le transcript de la séance ${precedente.numero}`}>
              {texte ? <p className="whitespace-pre-line text-[16px] leading-[1.55]">{texte}</p> : <p className="text-[16px] text-encre/70">Pas de texte pour cette séance.</p>}
              <Link href={`/coach/clientes/${id}/seances/${precedente.id}`} className="t-action text-[14px] text-violet">
                Ouvrir la séance →
              </Link>
            </Replie>
          ) : null}

          {affectations.length ? (
            <Bloc titre="Ressources">
              <ul className="text-[14px] leading-[1.6]">
                {affectations.map((a) => {
                  const r = ressources.find((x) => x.id === a.ressource_id);
                  const s = suivis.find((x) => x.affectation_id === a.id)?.statut ?? "a_voir";
                  return r ? (
                    <li key={a.id}>
                      {titrePropre(r.titre)} · <span className="font-italique italic text-violet">{SUIVIS[s]}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            </Bloc>
          ) : null}

          {estCoach ? (
            <section className="flex flex-col gap-2.5 border-y border-[var(--filet-papier)] py-[22px]">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-titre text-[20px] font-semibold leading-none text-violet">Ma préparation</h2>
                <span className="font-italique text-[12px] italic text-violet/80">privée · ni {cliente.prenom} ni Émilien</span>
              </div>
              <Preparation seanceId={seance.id} initial={preparation} />
            </section>
          ) : null}
        </div>
      </Colonne>
    </PageCoach>
  );
}
