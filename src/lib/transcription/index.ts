import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { TranscriptPretEmilien } from "@/emails/TranscriptPretEmilien";
import { jourEtMois } from "@/lib/dates";
import { envoyerUneFois } from "@/lib/emails";
import { createServiceClient } from "@/lib/supabase/service";
import type { Seance } from "@/lib/supabase/types";
import { analyserTranscript } from "./analyse";
import { creerPdfTranscript } from "./pdf";

const DEEPGRAM = "https://api.deepgram.com/v1/listen?model=nova-3&language=fr&diarize=true&punctuate=true&smart_format=true";
const SIX_HEURES = 6 * 3600;

const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();

// Le jeton dans l'adresse de retour : seul Deepgram, à qui on l'a donné, peut nous répondre pour cette transcription.
export function jetonTranscription(id: string) {
  return createHmac("sha256", secret()).update(id).digest("base64url");
}

export function jetonValide(id: string, jeton: string) {
  const attendu = Buffer.from(jetonTranscription(id));
  const recu = Buffer.from(jeton);
  return attendu.length === recu.length && timingSafeEqual(attendu, recu);
}

function adresseRetour(id: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/$/, "") || "https://parcours.amarecherche.fr";
  return `${base}/api/transcription/deepgram?t=${id}&j=${jetonTranscription(id)}`;
}

// Envoie l'audio d'une séance à Deepgram, qui répondra sur notre adresse de retour.
export async function lancerTranscription(seanceId: string): Promise<{ ok: boolean; message: string }> {
  const cle = process.env.DEEPGRAM_API_KEY?.trim();
  if (!cle) return { ok: false, message: "La transcription automatique n’est pas encore branchée." };
  const service = createServiceClient();
  const { data: seance } = await service.from("seances").select("audio_path").eq("id", seanceId).single();
  if (!seance?.audio_path) return { ok: false, message: "Il n’y a pas d’audio sur cette séance." };
  const { data: signe } = await service.storage.from("audio").createSignedUrl(seance.audio_path, SIX_HEURES);
  if (!signe) return { ok: false, message: "L’audio n’a pas pu être lu." };

  // Un nouveau dépôt remplace un traitement en cours.
  await service.from("transcriptions").update({ statut: "erreur", erreur: "remplacée par un nouveau dépôt" }).eq("seance_id", seanceId).in("statut", ["en_attente", "en_cours"]);
  const { data: ligne, error } = await service.from("transcriptions").insert({ seance_id: seanceId }).select("id").single();
  if (error || !ligne) return { ok: false, message: "La transcription n’a pas pu démarrer." };

  const r = await fetch(`${DEEPGRAM}&callback=${encodeURIComponent(adresseRetour(ligne.id))}`, {
    method: "POST",
    headers: { Authorization: `Token ${cle}`, "content-type": "application/json" },
    body: JSON.stringify({ url: signe.signedUrl }),
  }).catch(() => null);
  if (!r?.ok) {
    await service.from("transcriptions").update({ statut: "erreur", erreur: `Deepgram a refusé la demande (${r?.status ?? "réseau"})` }).eq("id", ligne.id);
    await service.from("seances").update({ transcript_statut: "erreur" }).eq("id", seanceId);
    return { ok: false, message: "La transcription n’a pas pu démarrer. Tu peux relancer depuis cette page." };
  }
  await service.from("transcriptions").update({ statut: "en_cours", demarree_at: new Date().toISOString() }).eq("id", ligne.id).eq("statut", "en_attente");
  await service.from("seances").update({ transcript_statut: "en_cours", transcript_erreur: null }).eq("id", seanceId);
  return { ok: true, message: "La transcription démarre." };
}

type Mot = { punctuated_word?: string; word: string; start: number; speaker?: number };
export type RetourDeepgram = { err_code?: string; err_msg?: string; results?: { channels?: { alternatives?: { transcript?: string; words?: Mot[] }[] }[] } };
type Tour = { voix: number; debut: number; texte: string };

// Deepgram donne des mots : on les regroupe en prises de parole.
function regrouper(mots: Mot[]) {
  const tours: Tour[] = [];
  for (const m of mots) {
    const voix = m.speaker ?? 0;
    const dernier = tours.at(-1);
    const mot = m.punctuated_word ?? m.word;
    if (dernier && dernier.voix === voix) dernier.texte += ` ${mot}`;
    else tours.push({ voix, debut: m.start, texte: mot });
  }
  return tours;
}

async function echec(id: string, seanceId: string, message: string) {
  const service = createServiceClient();
  await service.from("transcriptions").update({ statut: "erreur", erreur: message, terminee_at: new Date().toISOString() }).eq("id", id);
  await service.from("seances").update({ transcript_statut: "erreur", transcript_erreur: message }).eq("id", seanceId);
}

// Enregistre le texte brut, côté équipe seulement. Rapide : Deepgram attend notre réponse.
export async function recevoirResultat(id: string, seanceId: string, corps: RetourDeepgram) {
  const alternative = corps.results?.channels?.[0]?.alternatives?.[0];
  if (corps.err_code || !alternative?.words?.length) {
    await echec(id, seanceId, corps.err_msg ?? "Deepgram n’a rien renvoyé de lisible.");
    return null;
  }
  const tours = regrouper(alternative.words);
  const service = createServiceClient();
  await service.from("transcripts_bruts").upsert({ seance_id: seanceId, texte: alternative.transcript ?? tours.map((t) => t.texte).join(" "), segments: tours }, { onConflict: "seance_id" });
  return tours;
}

function dureeLisible(sec: number | null) {
  if (!sec) return null;
  const min = Math.round(sec / 60);
  return min >= 60 ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}` : `${min} minutes`;
}

// La suite : les voix, le texte, le PDF, les mots proposés, l'email à Émilien.
export async function finaliserTranscription(id: string, seanceId: string, tours: Tour[]) {
  const service = createServiceClient();
  try {
    const { data: seance } = await service.from("seances").select("*, parcours(profiles(prenom))").eq("id", seanceId).single<Seance & { parcours: { profiles: { prenom: string } } }>();
    if (!seance) throw new Error("Séance introuvable");
    const prenom = seance.parcours.profiles.prenom;
    const analyse = await analyserTranscript(tours, prenom);
    const voixDistinctes = [...new Set(tours.map((t) => t.voix))];
    const nomVoix = (v: number) => (analyse ? (v === analyse.voixCloe ? "Cloé" : prenom) : `Voix ${voixDistinctes.indexOf(v) + 1}`);
    const segments = tours.map((t) => ({ locuteur: nomVoix(t.voix), debut: t.debut, texte: t.texte }));
    const markdown = segments.map((s) => `**${s.locuteur} :** ${s.texte}`).join("\n\n");

    await service
      .from("seances")
      .update({
        transcript_formate: markdown,
        transcript_segments: segments,
        transcript_statut: "pret",
        transcript_erreur: null,
        mots_proposes: analyse?.mots ?? [],
        station_proposee: analyse?.station ?? null,
      })
      .eq("id", seanceId);

    try {
      const pdf = await creerPdfTranscript({
        prenom,
        numero: seance.numero,
        date: seance.date ? jourEtMois(seance.date) : null,
        tours: segments.map((s) => ({ locuteur: s.locuteur, texte: s.texte, cliente: Boolean(analyse) && s.locuteur !== "Cloé" })),
      });
      const chemin = `${seanceId}/${randomUUID()}.pdf`;
      const { error } = await service.storage.from("transcripts").upload(chemin, pdf, { contentType: "application/pdf" });
      if (!error) await service.from("seances").update({ transcript_pdf_path: chemin }).eq("id", seanceId);
    } catch (e) {
      console.error("PDF du transcript", e instanceof Error ? e.message : e);
    }

    const { data: relecteur } = await service.from("profiles").select("email").eq("role", "relecteur").eq("actif", true).limit(1).maybeSingle();
    if (relecteur) {
      const envoye = await envoyerUneFois({
        type: "transcript_pret",
        destinataire: relecteur.email,
        seanceId,
        sujet: `${prenom}, séance ${seance.numero} : le transcript est prêt`,
        corps: TranscriptPretEmilien({ prenom, numero: seance.numero, date: seance.date ? jourEtMois(seance.date) : null, duree: dureeLisible(seance.audio_duree_sec), seanceId }),
      });
      if (envoye) await service.from("seances").update({ emilien_notifie_at: new Date().toISOString() }).eq("id", seanceId);
    }
    await service.from("transcriptions").update({ statut: "terminee", erreur: null, terminee_at: new Date().toISOString() }).eq("id", id);
  } catch (e) {
    console.error("Fin de transcription", e instanceof Error ? e.message : e);
    await echec(id, seanceId, "La mise en forme du transcript n’a pas abouti.");
  }
}
