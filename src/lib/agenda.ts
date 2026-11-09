import { aujourdhuiParis, avantOuverture, joursDepuis } from "@/lib/dates";
import type { Seance } from "@/lib/supabase/types";

export type Point = "plein" | "vide" | "retard";
export type EtatSeance = { points: [Point, Point, Point]; libelle: string; retard: boolean; transcript: boolean; emilien: boolean; exercices: boolean };

export const transcriptPret = (s: Seance) => s.transcript_statut === "pret" || Boolean(s.transcript_formate || s.transcript_pdf_path || s.transcript_segments);
export const emilienPrevenu = (s: Seance) => Boolean(s.emilien_notifie_at || s.envoye_emilien_at);

// Les trois points d'une séance faite : transcript, Émilien, exercices. Rouge à J+1 pour le transcript,
// à J+7 pour les exercices, et seulement pour les séances datées après l'ouverture de la plateforme.
export function etatSeance(s: Seance, lettreEnvoyee: boolean): EtatSeance {
  const j = s.date && !avantOuverture(s.date) ? (joursDepuis(s.date) ?? 0) : null;
  const transcript = transcriptPret(s);
  const emilien = emilienPrevenu(s);
  const transcriptRetard = !transcript && j !== null && j >= 1;
  const exercicesRetard = !lettreEnvoyee && j !== null && j >= 7;
  const points: [Point, Point, Point] = [transcript ? "plein" : transcriptRetard ? "retard" : "vide", emilien ? "plein" : "vide", lettreEnvoyee ? "plein" : exercicesRetard ? "retard" : "vide"];
  let libelle: string;
  if (transcriptRetard) libelle = `transcript manquant · J+${j}`;
  else if (exercicesRetard) libelle = `exercices à écrire · J+${j}`;
  else if (transcript && emilien && lettreEnvoyee) libelle = "tout est fait";
  else libelle = [transcript ? "transcript prêt" : "transcript à venir", emilien ? "Émilien prévenu" : "Émilien à prévenir", lettreEnvoyee ? "exercices envoyés" : "exercices à écrire"].join(" · ");
  return { points, libelle, retard: transcriptRetard || exercicesRetard, transcript, emilien, exercices: lettreEnvoyee };
}

const jourNombre = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000;
const enCA = (d: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(d));

// « Cette semaine », « La semaine prochaine » ou « Plus tard », semaines commençant le lundi.
export function nomSemaine(d: string) {
  const aujourdhui = jourNombre(aujourdhuiParis());
  const joursDepuisLundi = (((aujourdhui + 3) % 7) + 7) % 7; // 1970-01-01 était un jeudi
  const ecart = Math.floor((jourNombre(enCA(d)) - (aujourdhui - joursDepuisLundi)) / 7);
  return ecart <= 0 ? "Cette semaine" : ecart === 1 ? "La semaine prochaine" : "Plus tard";
}

const NOMBRES = ["Zéro", "Une", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit", "Neuf", "Dix"];
export function phraseRetards(n: number) {
  if (n === 0) return "Rien en retard.";
  return `${NOMBRES[n] ?? n} chose${n > 1 ? "s" : ""} en retard.`;
}

export function aujourdhuiLong() {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(new Date());
}

// Pour trier sans appeler l'horloge dans un rendu.
export function estAVenir(d: string) {
  return new Date(d).getTime() >= Date.now();
}
