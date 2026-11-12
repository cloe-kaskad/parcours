import Link from "next/link";
import { notFound } from "next/navigation";
import { Barre, Colonne, LienRose, PageCoach } from "@/components/coach/base";
import { Lisible } from "@/components/coach/Lisible";
import { CopierDossier, Preparation } from "@/components/coach/Preparation";
import { TexteLecture, TexteOrigine } from "@/components/coach/TexteLecture";
import { VoixCliente } from "@/components/coach/VoixCliente";
import { Calendrier } from "@/components/espace/Calendrier";
import { exigerEquipe } from "@/lib/auth";
import { avantOuverture, jourEtHeure, jourEtMois, jourEtMoisCourt } from "@/lib/dates";
import { chargerAvant, texteSeance } from "@/lib/db/coach";
import { dossierSeance, partagerCarnet } from "@/lib/dossier";
import { lireLettre } from "@/lib/lettre";
import { texteRetour, texteStructure } from "@/lib/retour";
import { titrePropre } from "@/lib/textes";

export const metadata = { title: "Avant la séance" };

const SUIVIS = { a_voir: "à découvrir", commence: "commencé", termine: "terminé" };
const dateReelle = (d: string | null) => (d && !avantOuverture(d) ? jourEtMois(d) : null);

function Bloc({ titre, children, rouge = false, droite }: { titre: string; children: React.ReactNode; rouge?: boolean; droite?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-[var(--filet-papier)] py-[24px] first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className={`font-titre text-[20px] font-semibold leading-[1.1] ${rouge ? "text-rouge" : ""}`}>{titre}</h2>
        {droite}
      </div>
      {children}
    </section>
  );
}

const Vide = ({ children }: { children: React.ReactNode }) => <p className="m-0 text-[16px] text-encre/70">{children}</p>;

export default async function AvantLaSeance({ params }: PageProps<"/coach/clientes/[id]/seances/[seanceId]/avant">) {
  const profil = await exigerEquipe();
  const { id, seanceId } = await params;
  const estCoach = profil.role === "coach";
  const d = await chargerAvant(seanceId, estCoach);
  if (!d || d.cliente.id !== id) notFound();
  const { seance, cliente, precedente, meteos, etats, lettre, exercices, retours, affectations, suivis, ressources, preparation } = d;
  const p = cliente.prenom;
  const carnet = partagerCarnet(d);
  const texte = precedente ? texteSeance(precedente) : "";
  const libelle = (code: string) => etats.find((x) => x.code === code)?.libelle ?? code;
  const lue = lettre ? lireLettre(lettre.contenu || lettre.intro) : null;
  const retoursEcrits = retours.filter((r) => r.contenu.trim());

  return (
    <PageCoach>
      <Barre retour={{ href: "/coach", libelle: "Agenda" }} droite={<LienRose href={`/coach/clientes/${id}`}>Fiche de {p}</LienRose>} />
      <Colonne className="pb-16">
        <header className="flex items-center gap-4 pt-[30px]">
          {seance.date ? <Calendrier date={seance.date} prochaine surPapier retard /> : null}
          <div className="flex flex-col gap-1">
            <p className="font-italique text-[13px] italic text-violet">Avant la séance</p>
            <h1 className="font-titre text-[34px] font-semibold leading-[0.95] tracking-[-0.03em] text-violet">
              {p} · séance {seance.numero}
            </h1>
            {seance.date ? <p className="text-[14px] text-violet/80">{jourEtHeure(seance.date)}</p> : null}
          </div>
        </header>

        {estCoach ? (
          <div className="pt-[22px]">
            <CopierDossier dossier={dossierSeance(d)} />
          </div>
        ) : null}

        <div className="flex flex-col pt-[28px]">
          <Bloc titre="Ce qu’elle veut aborder" rouge>
            {carnet.aAborder.length ? carnet.aAborder.map((e) => <VoixCliente key={e.id} prenom={p} date={dateReelle(e.date)} texte={e.contenu} nouveau={estCoach && e.vu_par_coach_at === null} />) : <Vide>Rien de marqué pour l’instant.</Vide>}
          </Bloc>

          {lettre && lue ? (
            <Bloc
              titre={`La lettre · ${titrePropre(lettre.titre)}`}
              droite={
                <Link href={`/coach/clientes/${id}/lettre/${lettre.id}`} className="t-action text-[14px] text-violet">
                  Ouvrir →
                </Link>
              }
            >
              {lettre.publiee_at && dateReelle(lettre.publiee_at) ? <p className="m-0 font-italique text-[13px] italic text-violet">envoyée le {dateReelle(lettre.publiee_at)}</p> : null}
              {carnet.rienSousLettre ? <p className="m-0 font-titre text-[14px] font-semibold text-violet">Elle n’a rien écrit sous cette lettre.</p> : null}
              <Lisible titre={`${p} · ${titrePropre(lettre.titre)}`} replie>
                <div className="flex flex-col gap-7">
                  {lue.preambule.trim() ? <TexteLecture>{lue.preambule}</TexteLecture> : null}
                  {lue.chapitres.map((c) => {
                    const ex = exercices.find((e) => e.slug === c.slug);
                    const notes = ex ? carnet.sousExercice(ex.id) : [];
                    return (
                      <section key={c.slug} className="flex flex-col gap-3">
                        {c.titre.trim() ? <h3 className="m-0 font-titre text-[22px] font-semibold leading-[1.1] text-violet">{c.titre}</h3> : null}
                        <TexteLecture>{c.texte}</TexteLecture>
                        {notes.length ? notes.map((n) => <VoixCliente key={n.id} prenom={p} date={dateReelle(n.date)} texte={n.contenu} nouveau={estCoach && n.vu_par_coach_at === null} />) : ex && !carnet.rienSousLettre ? <p className="m-0 text-[14px] text-violet/70">Rien d’écrit sous cet exercice.</p> : null}
                      </section>
                    );
                  })}
                  {carnet.finDeLettre.length ? (
                    <section className="flex flex-col gap-3">
                      <h3 className="m-0 font-titre text-[16px] font-semibold text-violet">En fin de lettre</h3>
                      {carnet.finDeLettre.map((n) => (
                        <VoixCliente key={n.id} prenom={p} date={dateReelle(n.date)} texte={n.contenu} nouveau={estCoach && n.vu_par_coach_at === null} />
                      ))}
                    </section>
                  ) : null}
                </div>
              </Lisible>
            </Bloc>
          ) : null}

          {precedente ? (
            <Bloc titre={`Le retour d’Émilien · séance ${precedente.numero}`}>
              {retoursEcrits.length ? (
                retoursEcrits.map((r) => (
                  <Lisible key={r.id} titre={`Retour d’Émilien · ${p}, séance ${precedente.numero}`} replie>
                    <TexteLecture>{texteRetour(r)}</TexteLecture>
                    {r.contenu_lisible ? <TexteOrigine texte={r.contenu} /> : null}
                  </Lisible>
                ))
              ) : (
                <Vide>Pas de retour pour cette séance.</Vide>
              )}
            </Bloc>
          ) : null}

          {carnet.reste.length ? (
            <Bloc titre={precedente?.date ? `Le reste de son carnet depuis le ${jourEtMois(precedente.date)}` : "Le reste de son carnet"}>
              {carnet.reste.map((e) => (
                <VoixCliente key={e.id} prenom={p} date={dateReelle(e.date)} texte={e.contenu} nouveau={estCoach && e.vu_par_coach_at === null} />
              ))}
            </Bloc>
          ) : null}

          {meteos.length ? (
            <Bloc titre="Ses météos">
              <ul className="m-0 flex flex-col gap-1 pl-0 text-[15px] leading-[1.5]">
                {meteos.map((m) => (
                  <li key={m.id} className="list-none">
                    <span className="font-semibold">{libelle(m.etat_code)}</span> · {jourEtMoisCourt(m.date)}
                    {m.note?.trim() ? <span className="text-encre/80"> · {m.note.trim()}</span> : null}
                  </li>
                ))}
              </ul>
            </Bloc>
          ) : null}

          {affectations.length ? (
            <Bloc titre="Ressources">
              <ul className="m-0 flex flex-col gap-1 pl-0 text-[15px] leading-[1.5]">
                {affectations.map((a) => {
                  const r = ressources.find((x) => x.id === a.ressource_id);
                  const s = suivis.find((x) => x.affectation_id === a.id)?.statut ?? "a_voir";
                  return r ? (
                    <li key={a.id} className="list-none">
                      {titrePropre(r.titre)} · <span className="text-violet">{SUIVIS[s]}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            </Bloc>
          ) : null}

          {precedente ? (
            <Bloc
              titre={`Le transcript · séance ${precedente.numero}`}
              droite={
                <Link href={`/coach/clientes/${id}/seances/${precedente.id}`} className="t-action text-[14px] text-violet">
                  Ouvrir la séance →
                </Link>
              }
            >
              {texte ? (
                <Lisible titre={`Transcript · ${p}, séance ${precedente.numero}`} replie>
                  <TexteLecture>{texteStructure(texte)}</TexteLecture>
                </Lisible>
              ) : (
                <Vide>Pas de texte pour cette séance.</Vide>
              )}
            </Bloc>
          ) : null}

          {estCoach ? (
            <Bloc titre="Ma préparation" droite={<span className="font-italique text-[12px] italic text-violet/80">privée · ni {p} ni Émilien</span>}>
              <Preparation seanceId={seance.id} initial={preparation} />
            </Bloc>
          ) : null}
        </div>
      </Colonne>
    </PageCoach>
  );
}
