import Link from "next/link";
import { notFound } from "next/navigation";
import { Bandeau } from "@/components/espace/Bandeau";
import { EnteteSousPage } from "@/components/espace/EnteteSousPage";
import { GesteEcrire } from "@/components/espace/GesteEcrire";
import { TexteLettre } from "@/components/espace/TexteLettre";
import { exigerCliente } from "@/lib/auth";
import { avantOuverture, jourCalendrier, jourEtMois, prochaineSeance } from "@/lib/dates";
import { maLettre, mesSeances, monParcours } from "@/lib/db/cliente";
import { lireLettre } from "@/lib/lettre";
import { titrePropre } from "@/lib/textes";

export const metadata = { title: "La lettre" };

const dateReelle = (d: string | null) => (d && !avantOuverture(d) ? jourEtMois(d) : null);

export default async function PageLettre({ params }: PageProps<"/espace/lettre/[id]">) {
  const { id } = await params;
  const profil = await exigerCliente();
  const donnees = await maLettre(id, profil.id);
  if (!donnees) notFound();
  const { lettre, exercices, notes, avant } = donnees;
  const parcours = await monParcours(profil.id);
  const prochaine = prochaineSeance(parcours ? await mesSeances(parcours.id) : []);

  const { preambule, chapitres } = lireLettre(lettre.contenu || lettre.intro);
  const envoyee = dateReelle(lettre.publiee_at);
  const notesLibres = notes.filter((n) => !n.pratique_id);

  return (
    <div className="papier papier-page flex flex-1 flex-col">
      <Bandeau prenom={profil.prenom} />
      <article className="mx-auto flex w-full max-w-[640px] flex-col px-6">
        <EnteteSousPage surPapier />

        <header className="flex flex-col gap-2.5 pt-9">
          <h1 className="t-page text-violet">{titrePropre(lettre.titre)}</h1>
          {envoyee ? <p className="font-italique text-[15px] italic text-violet">envoyée le {envoyee}</p> : null}
        </header>

        {preambule ? (
          <div className="pt-[30px]">
            <TexteLettre>{preambule}</TexteLettre>
          </div>
        ) : null}

        {chapitres.map((c) => {
          const exercice = exercices.find((e) => e.slug === c.slug);
          const note = exercice ? notes.find((n) => n.pratique_id === exercice.id) : undefined;
          return (
            <section key={c.slug} className="flex flex-col gap-[18px] pt-[52px]">
              <div className="flex flex-col gap-1">
                {exercice?.bonus ? <p className="font-titre text-[13px] font-semibold tracking-[0.02em] text-rouge">Bonus</p> : null}
                <h2 className="t-exercice">{c.titre}</h2>
              </div>
              <TexteLettre>{c.texte}</TexteLettre>
              {exercice ? <GesteEcrire surPapier pratiqueId={exercice.id} serieId={lettre.id} note={note ? { id: note.id, date: note.date, contenu: note.contenu } : undefined} /> : null}
            </section>
          );
        })}

        {lettre.signature ? <p className="pt-14 font-italique text-[22px] italic text-violet">{lettre.signature}</p> : null}

        <section className="mt-14 flex flex-col gap-2.5 border-t border-violet/25 pt-[26px]">
          <h2 className="font-titre text-[26px] font-semibold leading-none tracking-[-0.02em] text-violet">Ce que je veux dire à Cloé</h2>
          <p className="text-[15px] leading-[1.6] text-violet">
            Une question, un doute, une chose que tu veux poser {prochaine?.date ? `avant le ${jourCalendrier(prochaine.date)}` : "avant la prochaine séance"}. Ça ira dans ton carnet, à aborder en séance.
          </p>
          {notesLibres.map((n) => (
            <GesteEcrire key={n.id} surPapier note={{ id: n.id, date: n.date, contenu: n.contenu }} />
          ))}
          <GesteEcrire surPapier serieId={lettre.id} aAborder />
        </section>

        {avant.length ? (
          <nav className="mt-14 flex flex-col gap-1 border-t border-violet/25 pb-[60px] pt-[26px]">
            <p className="pb-2.5 font-italique text-[14px] italic text-violet">Les lettres d’avant</p>
            {avant.map((l, i) => (
              <Link key={l.id} href={`/espace/lettre/${l.id}`} className={`flex items-baseline justify-between gap-3 py-2.5 font-titre text-[18px] font-semibold text-violet ${i < avant.length - 1 ? "border-b border-[var(--filet-papier)]" : ""}`}>
                <span>{titrePropre(l.titre)}</span>
                {dateReelle(l.publiee_at) ? <span className="shrink-0 font-italique text-[13px] font-normal italic opacity-70">{dateReelle(l.publiee_at)}</span> : null}
              </Link>
            ))}
          </nav>
        ) : (
          <div className="pb-[60px]" />
        )}
      </article>
    </div>
  );
}
