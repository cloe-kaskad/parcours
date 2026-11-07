import Link from "next/link";
import { notFound } from "next/navigation";
import { Formulaire } from "@/components/Formulaire";
import { Markdown } from "@/components/Markdown";
import { Bouton, Carte, Champ, FilAriane, Pastille, Selection, Vide, Zone } from "@/components/ui";
import {
  ajouterRetour,
  deposerTranscriptPdf,
  enregistrerTranscript,
  marquerEnvoyeEmilien,
  mettreAJourSeance,
  supprimerSeance,
} from "@/lib/actions/seances";
import { dateCourte, dateHeure, pourInputDateHeure } from "@/lib/dates";
import { chargerSeance } from "@/lib/db/coach";
import { urlSignee } from "@/lib/fichiers";
import { getProfil } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

export default async function PageSeance({ params }: PageProps<"/coach/clientes/[id]/seances/[seanceId]">) {
  const { id, seanceId } = await params;
  const data = await chargerSeance(seanceId);
  if (!data) notFound();
  const { seance, retours, auteurs, series } = data;
  const moi = (await getProfil())!;
  const supabase = await createClient();
  const { data: cliente } = await supabase.from("profiles").select("prenom, nom").eq("id", id).maybeSingle<Pick<Profile, "prenom" | "nom">>();
  const pdfUrl = seance.transcript_pdf_path ? await urlSignee("transcripts", seance.transcript_pdf_path) : null;

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <FilAriane
          elements={[
            { href: "/coach/clientes", label: "Clientes" },
            { href: `/coach/clientes/${id}`, label: `${cliente?.prenom ?? ""} ${cliente?.nom ?? ""}`.trim() },
            { label: `Séance ${seance.numero}` },
          ]}
        />
        <h1 className="text-4xl font-bold">Séance {seance.numero}</h1>
        <p className="mt-1 text-base text-prune">{dateHeure(seance.date)}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-6">
          <Carte titre="Informations">
            <Formulaire action={mettreAJourSeance} bouton="Enregistrer" variante="secondaire">
              <input type="hidden" name="id" value={seance.id} />
              <input type="hidden" name="cliente_id" value={id} />
              <Champ label="Numéro" name="numero" type="number" min={1} defaultValue={seance.numero} />
              <Champ label="Date et heure" name="date" type="datetime-local" defaultValue={pourInputDateHeure(seance.date)} />
              <Champ label="Durée (minutes)" name="duree_min" type="number" defaultValue={seance.duree_min} />
              <Selection label="Statut" name="statut" defaultValue={seance.statut}>
                <option value="planifiee">planifiée</option>
                <option value="faite">faite</option>
                <option value="annulee">annulée</option>
              </Selection>
            </Formulaire>
            <form action={supprimerSeance} className="mt-4 border-t border-beige pt-4">
              <input type="hidden" name="id" value={seance.id} />
              <input type="hidden" name="cliente_id" value={id} />
              <Bouton variante="danger" type="submit">
                Supprimer cette séance
              </Bouton>
            </form>
          </Carte>

          <Carte titre="Suivi">
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center justify-between">
                <span>Transcript</span>
                <Pastille ton={seance.transcript_statut === "pret" ? "ok" : "neutre"}>{seance.transcript_statut}</Pastille>
              </li>
              <li className="flex items-center justify-between">
                <span>Transmis à Émilien</span>
                {seance.envoye_emilien_at ? <Pastille ton="ok">{dateCourte(seance.envoye_emilien_at)}</Pastille> : <Pastille>non</Pastille>}
              </li>
              <li className="flex items-center justify-between">
                <span>Pratiques publiées</span>
                {series.some((s) => s.publiee_at) ? <Pastille ton="ok">oui</Pastille> : <Pastille>non</Pastille>}
              </li>
            </ul>
            {!seance.envoye_emilien_at && seance.transcript_statut === "pret" ? (
              <div className="mt-4">
                <Formulaire action={marquerEnvoyeEmilien} bouton="Marquer comme transmis à Émilien" variante="secondaire">
                  <input type="hidden" name="id" value={seance.id} />
                  <input type="hidden" name="cliente_id" value={id} />
                </Formulaire>
              </div>
            ) : null}
            {series.length ? (
              <p className="mt-4 text-sm">
                {series.map((s) => (
                  <Link key={s.id} href={`/coach/clientes/${id}/pratiques/${s.id}`} className="text-rouge underline-offset-4 hover:underline">
                    {s.titre || "Lettre de pratiques"}
                  </Link>
                ))}
              </p>
            ) : null}
          </Carte>
        </div>

        <div className="flex flex-col gap-6">
          <Carte titre="Transcript">
            {pdfUrl ? (
              <p className="mb-4 text-sm">
                PDF déposé :{" "}
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="font-medium text-rouge underline-offset-4 hover:underline">
                  ouvrir le transcript
                </a>
              </p>
            ) : null}
            <Formulaire action={deposerTranscriptPdf} bouton="Déposer le PDF" variante="secondaire" enLigne>
              <input type="hidden" name="id" value={seance.id} />
              <input type="hidden" name="cliente_id" value={id} />
              <input type="hidden" name="parcours_id" value={seance.parcours_id} />
              <Champ label="Fichier PDF du transcript" name="fichier" type="file" accept="application/pdf" />
            </Formulaire>
            <div className="mt-6 border-t border-beige pt-6">
              <Formulaire action={enregistrerTranscript} bouton="Enregistrer le texte" variante="secondaire">
                <input type="hidden" name="id" value={seance.id} />
                <input type="hidden" name="cliente_id" value={id} />
                <Zone
                  label="Texte du transcript (Markdown)"
                  name="transcript_formate"
                  defaultValue={seance.transcript_formate ?? ""}
                  rows={16}
                  aide="Visible par la cliente dans « Séances ». La transcription automatique depuis l’audio arrivera dans une prochaine version."
                />
              </Formulaire>
            </div>
          </Carte>

          <Carte titre="Retours d’Émilien" action={<Pastille>invisibles pour la cliente</Pastille>}>
            {!retours.length ? (
              <Vide>Aucun retour pour cette séance.</Vide>
            ) : (
              <ul className="flex flex-col gap-4">
                {retours.map((r) => (
                  <li key={r.id} className="rounded-xl bg-creme p-4">
                    <p className="mb-2 text-xs text-gris">
                      {auteurs.find((a) => a.id === r.auteur_id)?.prenom ?? "Équipe"}, {dateCourte(r.created_at)}
                    </p>
                    <Markdown>{r.contenu}</Markdown>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 border-t border-beige pt-5">
              <Formulaire action={ajouterRetour} bouton={moi.role === "relecteur" ? "Ajouter mon retour" : "Ajouter une note"} variante="secondaire">
                <input type="hidden" name="seance_id" value={seance.id} />
                <input type="hidden" name="cliente_id" value={id} />
                <Zone label="Retour (Markdown)" name="contenu" rows={8} />
              </Formulaire>
            </div>
          </Carte>
        </div>
      </div>
    </div>
  );
}
