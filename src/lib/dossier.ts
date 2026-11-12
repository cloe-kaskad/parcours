// Le dossier d'une séance, en Markdown, pour préparer la séance avec Claude (« Copier le dossier pour Claude »).
// Le même dossier servira au connecteur.
import { avantOuverture, jourEtHeure, jourEtMois } from "@/lib/dates";
import { lireLettre } from "@/lib/lettre";
import { texteRetour, texteStructure } from "@/lib/retour";
import { titrePropre } from "@/lib/textes";
import type { JournalEntree, Meteo, Pratique, PratiquesSerie, Profile, Parcours, Ressource, RessourceAffectation, RessourceSuivi, Retour, Seance } from "@/lib/supabase/types";

export type DonneesDossier = {
  seance: Seance;
  cliente: Profile;
  parcours: Parcours;
  precedente: Seance | null;
  carnet: JournalEntree[];
  meteos: Meteo[];
  etats: { code: string; libelle: string }[];
  lettre: PratiquesSerie | null;
  exercices: Pratique[];
  retours: Retour[];
  affectations: RessourceAffectation[];
  suivis: RessourceSuivi[];
  ressources: Ressource[];
  preparationPrecedente: string;
  noteEquipe: string;
  seancesFaites: Seance[];
};

const SUIVIS = { a_voir: "à découvrir", commence: "commencé", termine: "terminé" } as const;
const date = (d: string | null) => (d && !avantOuverture(d) ? jourEtMois(d) : "date inconnue");
const citation = (texte: string) =>
  texte
    .trim()
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");

// Partage le carnet comme « Avant la séance » : à aborder, notes de la lettre, le reste depuis la dernière séance.
export function partagerCarnet(d: Pick<DonneesDossier, "carnet" | "lettre" | "exercices" | "precedente">) {
  const depuis = d.precedente?.date?.slice(0, 10);
  const deLaLettre = d.lettre ? d.carnet.filter((e) => e.serie_id === d.lettre!.id) : [];
  const aAborder = d.carnet.filter((e) => e.pour_prochaine_seance);
  const sousExercice = (pratiqueId: string) => deLaLettre.filter((e) => e.pratique_id === pratiqueId);
  const finDeLettre = deLaLettre.filter((e) => !e.pratique_id && !e.pour_prochaine_seance);
  const reste = d.carnet.filter((e) => !e.pour_prochaine_seance && e.serie_id !== d.lettre?.id && (!depuis || e.date >= depuis));
  return { aAborder, sousExercice, finDeLettre, reste, rienSousLettre: deLaLettre.length === 0 };
}

export function dossierSeance(d: DonneesDossier) {
  const p = d.cliente.prenom;
  const c = partagerCarnet(d);
  const l: string[] = [];
  const titre = (t: string) => l.push("", `## ${t}`, "");

  l.push(`# Dossier de séance : ${p}, séance ${d.seance.numero}`, "");
  l.push(`- Cliente : ${p}`, `- Séance : ${d.seance.numero}${d.seance.date ? `, ${jourEtHeure(d.seance.date)}` : ", pas encore datée"}`);
  if (d.parcours.date_debut) l.push(`- Début du parcours : ${jourEtMois(d.parcours.date_debut)} ${d.parcours.date_debut.slice(0, 4)}`);
  l.push(`- Séances vécues : ${d.seancesFaites.length}`);

  titre("Intention et note de parcours");
  l.push(d.parcours.intention.trim() ? `Intention : ${d.parcours.intention.trim()}` : "Intention : non renseignée");
  if (d.noteEquipe.trim()) l.push("", "Note de parcours (équipe, jamais visible par elle) :", "", d.noteEquipe.trim());

  titre("Ce qu'elle veut aborder");
  if (c.aAborder.length) c.aAborder.forEach((e) => l.push(`${p} a écrit, ${date(e.date)} :`, "", citation(e.contenu), ""));
  else l.push("Rien de marqué.");

  titre("La lettre envoyée, avec ce qu'elle a écrit");
  if (d.lettre) {
    l.push(`### ${titrePropre(d.lettre.titre)}${d.lettre.publiee_at && !avantOuverture(d.lettre.publiee_at) ? ` (envoyée le ${jourEtMois(d.lettre.publiee_at)})` : ""}`, "");
    const { preambule, chapitres } = lireLettre(d.lettre.contenu || d.lettre.intro);
    if (preambule.trim()) l.push(preambule.trim(), "");
    for (const ch of chapitres) {
      l.push(ch.titre.trim() ? `#### ${ch.titre}` : "", "", ch.texte.trim(), "");
      const ex = d.exercices.find((e) => e.slug === ch.slug);
      const notes = ex ? c.sousExercice(ex.id) : [];
      if (notes.length) notes.forEach((n) => l.push(`${p} a écrit sous cet exercice, ${date(n.date)} :`, "", citation(n.contenu), ""));
      else l.push(`(${p} n'a rien écrit sous cet exercice.)`, "");
    }
    if (c.finDeLettre.length) c.finDeLettre.forEach((n) => l.push(`${p} a écrit en fin de lettre, ${date(n.date)} :`, "", citation(n.contenu), ""));
    if (c.rienSousLettre) l.push(`(${p} n'a rien écrit sous cette lettre.)`);
  } else l.push("Pas de lettre envoyée.");

  titre(d.precedente?.date ? `Le reste de son carnet depuis le ${jourEtMois(d.precedente.date)}` : "Le reste de son carnet");
  if (c.reste.length) c.reste.forEach((e) => l.push(`${date(e.date)} :`, "", citation(e.contenu), ""));
  else l.push("Rien.");

  titre("Ses météos");
  const libelle = (code: string) => d.etats.find((x) => x.code === code)?.libelle ?? code;
  if (d.meteos.length) d.meteos.forEach((m) => l.push(`- ${date(m.date)} : ${libelle(m.etat_code)}${m.note?.trim() ? ` (« ${m.note.trim()} »)` : ""}`));
  else l.push("Aucune.");

  titre("Ressources et suivi");
  const lignes = d.affectations.flatMap((a) => {
    const r = d.ressources.find((x) => x.id === a.ressource_id);
    const s = d.suivis.find((x) => x.affectation_id === a.id)?.statut ?? "a_voir";
    return r ? [`- ${titrePropre(r.titre)} : ${SUIVIS[s as keyof typeof SUIVIS] ?? s}`] : [];
  });
  l.push(...(lignes.length ? lignes : ["Aucune."]));

  titre(d.precedente ? `Le retour d'Émilien sur la séance ${d.precedente.numero}` : "Le retour d'Émilien");
  const retours = d.retours.filter((r) => r.contenu.trim());
  if (retours.length) retours.forEach((r) => l.push(texteRetour(r), ""));
  else l.push("Pas de retour.");

  titre(d.precedente ? `Le transcript de la séance ${d.precedente.numero}` : "Le transcript de la dernière séance");
  const transcript = d.precedente ? (d.precedente.transcript_segments?.length ? d.precedente.transcript_segments.map((t) => `${t.locuteur} : ${t.texte}`).join("\n\n") : (d.precedente.transcript_formate ?? "")) : "";
  l.push(transcript.trim() ? texteStructure(transcript) : "Pas de transcript.");

  titre("Mots et stations du chemin");
  const chemin = d.seancesFaites.filter((s) => s.mots_cles.length || s.station_validee || s.mots_proposes.length || s.station_proposee);
  if (chemin.length)
    chemin.forEach((s) => {
      const mots = s.mots_cles.length ? s.mots_cles.join(", ") : s.mots_proposes.length ? `${s.mots_proposes.join(", ")} (proposés, pas encore validés)` : "aucun";
      const station = s.station_validee ?? (s.station_proposee ? `${s.station_proposee} (proposée)` : "aucune");
      l.push(`- Séance ${s.numero} : mots ${mots} ; station ${station}`);
    });
  else l.push("Rien de posé.");

  titre(d.precedente ? `Ma préparation de la séance ${d.precedente.numero}` : "Ma préparation précédente");
  l.push(d.preparationPrecedente.trim() || "Pas de préparation.");

  return l.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
