import Link from "next/link";
import { notFound } from "next/navigation";
import { PageCoach } from "@/components/coach/base";
import { Barre } from "@/components/coach/Entete";
import { Liseuse, OuvrirLecture } from "@/components/coach/Liseuse";
import { TexteLecture } from "@/components/coach/TexteLecture";
import { ProposerMots } from "@/components/coach/VueEquipe";
import { validerEtSuivante } from "@/lib/actions/seances";
import { exigerCoach } from "@/lib/auth";
import { pourInputDateHeure } from "@/lib/dates";
import { chargerVueEquipe, resumesDe, texteSeance } from "@/lib/db/coach";
import { texteRetour, texteStructure } from "@/lib/retour";
import { extrait, minutesDeLecture } from "@/lib/textes";

export const metadata = { title: "Dater et nommer" };

// Une séance après l'autre : la date, trois mots, la station. Les propositions sont préremplies.
export default async function DaterEtNommer({ params, searchParams }: PageProps<"/coach/clientes/[id]/dater">) {
  const moi = await exigerCoach();
  const { id } = await params;
  const q = await searchParams;
  const d = await chargerVueEquipe(id, moi, false);
  if (!d) notFound();
  const { profil, seances, objets } = d;
  const p = profil.prenom;
  const fait = Number(q.fait) || 0;

  const liste = [...seances].reverse().filter((s) => s.statut === "faite" && (!s.date || (!s.mots_cles.length && !s.station_validee)));
  const s = liste.find((x) => x.id === q.s) ?? (q.fin ? null : liste[0]) ?? null;

  if (!s) {
    return (
      <PageCoach>
        <Barre retour={{ href: `/coach/clientes/${id}`, libelle: p }} cliente={p} />
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-[22px] pb-16 pt-8">
          <p className="m-0 font-italique text-[14px] italic text-violet">Dater et nommer</p>
          <h1 className="m-0 font-titre text-[34px] font-semibold leading-none tracking-[-0.03em] text-violet">{liste.length ? "C’est fini pour cette fois." : "Tout est daté et nommé."}</h1>
          <p className="m-0 text-[16px] leading-[1.6]">{liste.length ? `${liste.length > 1 ? `${liste.length} séances restent` : "Une séance reste"} à dater ou à nommer : tu les retrouveras sur sa fiche.` : `Le chemin de ${p} se dessine avec ce que tu as validé.`}</p>
          <Link href={`/coach/clientes/${id}`} className="bouton-rouge inline-flex items-center self-start">
            Retour à la fiche de {p}
          </Link>
        </div>
      </PageCoach>
    );
  }

  const i = liste.indexOf(s);
  const suivante = liste.slice(i + 1)[0] ?? null;
  const total = fait + liste.length;
  const position = fait + i + 1;
  const o = objets.get(s.id);
  const retour = o?.retours.find((r) => r.contenu.trim());
  const transcript = texteSeance(s);
  const r = (await resumesDe([s.id])).get(s.id);
  const souvenir = r?.resume?.trim() || r?.resume_propose?.trim() || retour?.phrase_cle?.trim() || (retour ? extrait(texteRetour(retour), 200) : transcript ? extrait(transcript, 200) : "");
  const mots = s.mots_cles.length ? s.mots_cles : s.mots_proposes;
  const station = s.station_validee ?? s.station_proposee ?? "";
  const textes = transcript ? [{ cle: "transcript", onglet: "Transcript", annonce: "le transcript", titre: `Séance ${s.numero} de ${p}`, meta: `Le transcript · ${minutesDeLecture(transcript)} min de lecture`, contenu: <TexteLecture>{texteStructure(transcript)}</TexteLecture> }] : [];

  return (
    <PageCoach>
      <Barre retour={{ href: `/coach/clientes/${id}`, libelle: p }} cliente={p} />
      <Liseuse textes={textes}>
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-[22px] px-[22px] pb-14 pt-6">
          <div className="flex items-baseline justify-between">
            <span className="font-italique text-[14px] italic text-violet">Dater et nommer</span>
            <span className="font-titre text-[14px] font-semibold text-violet">
              {position} sur {total}
            </span>
          </div>
          <div aria-hidden className="h-[3px] rounded-[3px] bg-beige">
            <div className="h-[3px] rounded-[3px] bg-violet" style={{ width: `${Math.round((position / total) * 100)}%` }} />
          </div>
          <h1 className="m-0 font-titre text-[34px] font-semibold leading-none tracking-[-0.03em] text-violet">Séance {s.numero}</h1>
          {q.erreur ? <p className="m-0 text-[15px] text-rouge">Ça n’a pas été enregistré. Réessaie dans un instant.</p> : null}
          {souvenir || transcript ? (
            <div className="carte-blanche flex flex-col gap-1 px-3.5 py-3">
              {souvenir ? (
                <p className="m-0 text-[15px] leading-[1.55]">
                  <span className="font-titre font-semibold text-violet">Pour te souvenir. </span>
                  {souvenir}
                </p>
              ) : null}
              {transcript ? (
                <OuvrirLecture cle="transcript" className="self-start text-[14px] text-violet underline underline-offset-[3px]">
                  lire le transcript
                </OuvrirLecture>
              ) : null}
            </div>
          ) : null}
          <form key={`${s.id}-${mots.join("|")}-${station}`} action={validerEtSuivante} className="flex flex-col gap-[22px]">
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="cliente_id" value={id} />
            <input type="hidden" name="fait" value={fait} />
            <input type="hidden" name="suivante" value={suivante?.id ?? ""} />
            <label className="etiquette text-[14px]">
              date{s.date ? "" : " (elle n’en a pas encore)"}
              <input type="datetime-local" name="date" defaultValue={pourInputDateHeure(s.date)} className="champ" />
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14px] text-violet">{s.mots_cles.length ? "trois mots (validés, tu peux corriger)" : mots.length ? "trois mots (proposés, tu corriges)" : "trois mots"}</span>
                {!s.mots_cles.length && transcript ? <ProposerMots seanceId={s.id} dejaPropose={mots.length > 0} /> : null}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[0, 1, 2].map((k) => (
                  <input key={k} name={`mot${k + 1}`} aria-label={`mot ${k + 1}`} defaultValue={mots[k] ?? ""} className="champ min-w-0" />
                ))}
              </div>
            </div>
            <label className="etiquette text-[14px]">
              station sur le chemin
              <input name="station" defaultValue={station} className="champ" />
            </label>
            <div className="flex items-center justify-between pt-2">
              {suivante ? (
                <Link href={`/coach/clientes/${id}/dater?s=${suivante.id}&fait=${fait}`} className="outil inline-flex min-h-[44px] items-center text-[15px]">
                  passer
                </Link>
              ) : (
                <Link href={`/coach/clientes/${id}`} className="outil inline-flex min-h-[44px] items-center text-[15px]">
                  passer
                </Link>
              )}
              <button type="submit" className="bouton-rouge">
                {suivante ? "Valider et suivante →" : "Valider et finir"}
              </button>
            </div>
          </form>
        </div>
      </Liseuse>
    </PageCoach>
  );
}
