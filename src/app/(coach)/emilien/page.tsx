import Link from "next/link";
import { redirect } from "next/navigation";
import { LigneSeance, PageCoach } from "@/components/coach/base";
import { Logo } from "@/components/espace/Logo";
import { Deconnexion } from "@/components/Deconnexion";
import { exigerEquipe } from "@/lib/auth";
import { chargerALire } from "@/lib/db/coach";

export const metadata = { title: "À lire" };

const NOMBRES = ["", "Une", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit", "Neuf", "Dix"];

function dureeTexte(sec: number | null) {
  if (!sec) return null;
  const min = Math.round(sec / 60);
  return min >= 60 ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}` : `${min} min`;
}

export default async function ALire() {
  const profil = await exigerEquipe();
  if (profil.role === "coach") redirect("/coach");
  const { aLire, traitees } = await chargerALire(profil.id);
  const n = aLire.length;
  return (
    <PageCoach>
      <header className="flex items-center justify-between gap-4 bg-violet px-[22px] py-3.5 md:px-10">
        <Logo couleur="blanc" hauteur={34} />
        <nav className="flex items-center gap-[18px]">
          <Link href="/coach/clientes" className="t-action inline-flex min-h-[44px] items-center text-[14px] text-creme/80">
            Clientes
          </Link>
          <Deconnexion className="text-creme/70" />
        </nav>
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-[22px]">
        <div className="flex flex-col gap-2 pt-8">
          <h1 className="t-page text-violet">Bonjour {profil.prenom}</h1>
          <p className="font-italique text-[15px] italic text-violet">{n === 0 ? "Rien ne t’attend pour l’instant." : `${NOMBRES[n] ?? n} séance${n > 1 ? "s" : ""} t’attend${n > 1 ? "ent" : ""}. La plus ancienne d’abord.`}</p>
        </div>
        {n ? (
          <section className="flex flex-col pt-[30px]">
            <h2 className="pb-2.5 font-titre text-[22px] font-semibold tracking-[-0.02em] text-rouge">À lire</h2>
            {aLire.map((l) => (
              <LigneSeance
                key={l.seance.id}
                href={`/emilien/seances/${l.seance.id}`}
                date={l.seance.date}
                prenom={l.prenom}
                numero={l.seance.numero}
                libelle={[dureeTexte(l.seance.audio_duree_sec) && `audio ${dureeTexte(l.seance.audio_duree_sec)}`, "transcript prêt"].filter(Boolean).join(" · ")}
                droite={<span className="t-action shrink-0 text-[14px] text-rouge">Lire et écouter →</span>}
              />
            ))}
          </section>
        ) : null}
        {traitees.length ? (
          <details className="group flex flex-col pt-10">
            <summary className="flex min-h-[44px] cursor-pointer items-baseline justify-between pb-2.5">
              <span className="font-titre text-[22px] font-semibold tracking-[-0.02em]">Déjà traitées</span>
              <span className="font-italique text-[13px] italic text-violet group-open:hidden">replié · {traitees.length} séances</span>
            </summary>
            {traitees.map((l) => (
              <LigneSeance key={l.seance.id} href={`/emilien/seances/${l.seance.id}`} date={l.seance.date} prenom={l.prenom} numero={l.seance.numero} libelle={l.envoye ? "retour envoyé · modifiable" : "reprise de Notion"} droite={null} />
            ))}
          </details>
        ) : null}
        <div className="mt-auto flex flex-col gap-3 pb-14 pt-10">
          <p className="text-[12px] text-violet/70">Les fiches clientes sont accessibles en lecture.</p>
        </div>
      </div>
    </PageCoach>
  );
}
