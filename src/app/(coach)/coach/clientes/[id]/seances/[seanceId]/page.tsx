import Link from "next/link";
import { notFound } from "next/navigation";
import { Formulaire } from "@/components/Formulaire";
import { Markdown } from "@/components/Markdown";
import { Bouton, Champ, FilAriane, LienBouton, Pastille, Selection, Vide, Zone } from "@/components/ui";
import { creerSerie } from "@/lib/actions/pratiques";
import {
  ajouterRetour,
  deposerTranscriptPdf,
  enregistrerTranscript,
  marquerEnvoyeEmilien,
  mettreAJourSeance,
  supprimerSeance,
} from "@/lib/actions/seances";
import { avantOuverture, dateCourte, dateHeure, joursDepuis, pourInputDateHeure } from "@/lib/dates";
import { chargerSeance } from "@/lib/db/coach";
import { urlSignee } from "@/lib/fichiers";
import { createClient, getProfil } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

function Etape({
  numero,
  titre,
  etat,
  resume,
  children,
}: {
  numero: number;
  titre: string;
  etat: "fait" | "a_faire" | "en_attente";
  resume?: string;
  children: React.ReactNode;
}) {
  const pastille = etat === "fait" ? <Pastille ton="ok">fait</Pastille> : etat === "a_faire" ? <Pastille ton="alerte">à faire</Pastille> : <Pastille>plus tard</Pastille>;
  return (
    <section className="carte bloc p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${etat === "fait" ? "bg-violet text-creme" : "bg-violet/10 text-violet"}`}
          aria-hidden="true"
        >
          {numero}
        </span>
        <h2 className="text-[1.35rem] font-bold">{titre}</h2>
        {pastille}
        {resume ? <span className="text-sm text-gris">{resume}</span> : null}
      </div>
      <div className="mt-4 pl-0 md:pl-11">{children}</div>
    </section>
  );
}

export default async function PageSeance({ params }: PageProps<"/coach/clientes/[id]/seances/[seanceId]">) {
  const { id, seanceId } = await params;
  const data = await chargerSeance(seanceId);
  if (!data) notFound();
  const { seance, retours, auteurs, series } = data;
  const moi = (await getProfil())!;
  const supabase = await createClient();
  const { data: cliente } = await supabase.from("profiles").select("prenom, nom").eq("id", id).maybeSingle<Pick<Profile, "prenom" | "nom">>();
  const pdfUrl = seance.transcript_pdf_path ? await urlSignee("transcripts", seance.transcript_pdf_path) : null;

  const faite = seance.statut === "faite";
  const transcriptPret = seance.transcript_statut === "pret";
  const serie = series[0] ?? null;
  const j = joursDepuis(seance.date);

  return (
    <div className="flex flex-col gap-5">
      <section className="bloc">
        <FilAriane
          elements={[
            { href: "/coach/clientes", label: "Clientes" },
            { href: `/coach/clientes/${id}`, label: cliente?.prenom ?? "" },
            { label: `Séance ${seance.numero}` },
          ]}
        />
        <h1 className="text-4xl font-bold md:text-5xl">
          {cliente?.prenom}, séance {seance.numero}
        </h1>
        <p className="mt-1 text-base text-gris">
          {dateHeure(seance.date)}
          {faite && j !== null ? ` · il y a ${j} jour${j > 1 ? "s" : ""}` : ""}
        </p>
      </section>

      <Etape numero={1} titre="La séance" etat={faite ? "fait" : seance.statut === "annulee" ? "en_attente" : "a_faire"}>
        <Formulaire action={mettreAJourSeance} bouton="Enregistrer" variante="secondaire" enLigne>
          <input type="hidden" name="id" value={seance.id} />
          <input type="hidden" name="cliente_id" value={id} />
          <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div className="col-span-2 md:col-span-1">
              <Champ label="Date et heure" name="date" type="datetime-local" defaultValue={pourInputDateHeure(seance.date)} />
            </div>
            <Champ label="Durée (min)" name="duree_min" type="number" defaultValue={seance.duree_min} />
            <Champ label="Numéro" name="numero" type="number" min={1} defaultValue={seance.numero} />
            <div className="col-span-2 md:col-span-1">
              <Selection label="Statut" name="statut" defaultValue={seance.statut}>
                <option value="planifiee">à venir</option>
                <option value="faite">faite</option>
                <option value="annulee">annulée</option>
              </Selection>
            </div>
          </div>
        </Formulaire>
        {!faite ? <p className="mt-3 text-sm text-gris">Une fois la séance passée, mets-la en « faite » : les étapes suivantes s’activent et les rappels démarrent.</p> : null}
      </Etape>

      <Etape numero={2} titre="Le transcript" etat={transcriptPret ? "fait" : faite ? "a_faire" : "en_attente"} resume={faite && !transcriptPret ? "à déposer le jour même ou le lendemain" : undefined}>
        {pdfUrl ? (
          <p className="mb-4 text-sm">
            PDF en place :{" "}
            <a href={pdfUrl} target="_blank" rel="noreferrer" className="font-semibold text-rouge underline-offset-4 hover:underline">
              ouvrir le transcript
            </a>
          </p>
        ) : null}
        <Formulaire action={deposerTranscriptPdf} bouton={pdfUrl ? "Remplacer le PDF" : "Déposer le PDF"} variante="secondaire" enLigne>
          <input type="hidden" name="id" value={seance.id} />
          <input type="hidden" name="cliente_id" value={id} />
          <input type="hidden" name="parcours_id" value={seance.parcours_id} />
          <Champ label="Fichier PDF (4 Mo max)" name="fichier" type="file" accept="application/pdf" />
        </Formulaire>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-violet">{seance.transcript_formate ? "Modifier le texte du transcript" : "Ou coller le texte du transcript"}</summary>
          <div className="mt-3">
            <Formulaire action={enregistrerTranscript} bouton="Enregistrer le texte" variante="secondaire">
              <input type="hidden" name="id" value={seance.id} />
              <input type="hidden" name="cliente_id" value={id} />
              <Zone label="Transcript (Markdown)" name="transcript_formate" defaultValue={seance.transcript_formate ?? ""} rows={14} aide="Visible par la cliente dans « Mes séances ». La transcription automatique depuis l’audio arrive dans une prochaine version." />
            </Formulaire>
          </div>
        </details>
      </Etape>

      <Etape
        numero={3}
        titre="Émilien"
        etat={seance.envoye_emilien_at ? "fait" : transcriptPret ? "a_faire" : "en_attente"}
        resume={seance.envoye_emilien_at && !avantOuverture(seance.envoye_emilien_at) ? `transmis le ${dateCourte(seance.envoye_emilien_at)}` : undefined}
      >
        {!seance.envoye_emilien_at && transcriptPret ? (
          <div className="mb-4">
            <Formulaire action={marquerEnvoyeEmilien} bouton="Transcript transmis à Émilien" variante="secondaire">
              <input type="hidden" name="id" value={seance.id} />
              <input type="hidden" name="cliente_id" value={id} />
            </Formulaire>
          </div>
        ) : null}
        {!retours.length ? (
          <Vide>Pas encore de retour. Émilien peut l’écrire directement ici, la cliente ne le voit pas.</Vide>
        ) : (
          <ul className="flex flex-col gap-3">
            {retours.map((r) => (
              <li key={r.id} className="rounded-xl bg-surface-douce p-4">
                <p className="mb-2 text-xs text-gris">
                  {auteurs.find((a) => a.id === r.auteur_id)?.prenom ?? "Équipe"}, {dateCourte(r.created_at)}
                </p>
                <Markdown>{r.contenu}</Markdown>
              </li>
            ))}
          </ul>
        )}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-violet">{moi.role === "relecteur" ? "Écrire mon retour" : "Ajouter une note"}</summary>
          <div className="mt-3">
            <Formulaire action={ajouterRetour} bouton="Enregistrer" variante="secondaire">
              <input type="hidden" name="seance_id" value={seance.id} />
              <input type="hidden" name="cliente_id" value={id} />
              <Zone label="Retour (Markdown)" name="contenu" rows={8} />
            </Formulaire>
          </div>
        </details>
      </Etape>

      <Etape
        numero={4}
        titre="Les exercices"
        etat={serie?.publiee_at ? "fait" : faite ? "a_faire" : "en_attente"}
        resume={serie?.publiee_at ? (avantOuverture(serie.publiee_at) ? undefined : `envoyés le ${dateCourte(serie.publiee_at)}`) : faite ? "à envoyer dans les 7 jours" : undefined}
      >
        {serie ? (
          <div className="flex flex-wrap items-center gap-3">
            <LienBouton href={`/coach/clientes/${id}/exercices/${serie.id}`} variante={serie.publiee_at ? "secondaire" : "primaire"}>
              {serie.publiee_at ? "Voir les exercices envoyés" : "Continuer la préparation"}
            </LienBouton>
            {!serie.publiee_at ? <span className="text-sm text-gris">brouillon, pas encore visible par la cliente</span> : null}
          </div>
        ) : (
          <Formulaire action={creerSerie} bouton="Préparer les exercices" variante={faite ? "primaire" : "secondaire"} enLigne>
            <input type="hidden" name="parcours_id" value={seance.parcours_id} />
            <input type="hidden" name="cliente_id" value={id} />
            <input type="hidden" name="seance_id" value={seance.id} />
            <input type="hidden" name="titre" value={`Après la séance ${seance.numero}`} />
          </Formulaire>
        )}
      </Etape>

      <div className="bloc flex items-center justify-between px-1">
        <Link href={`/coach/clientes/${id}`} className="text-sm text-gris hover:text-violet">
          Retour à {cliente?.prenom}
        </Link>
        <form action={supprimerSeance}>
          <input type="hidden" name="id" value={seance.id} />
          <input type="hidden" name="cliente_id" value={id} />
          <Bouton variante="danger" type="submit">
            Supprimer cette séance
          </Bouton>
        </form>
      </div>
    </div>
  );
}
