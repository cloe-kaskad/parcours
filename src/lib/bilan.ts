import "server-only";
import { avantOuverture, jourEtMois, moisAnnee } from "@/lib/dates";
import { debutDuParcours } from "@/lib/chemin";
import { createClient } from "@/lib/supabase/server";
import type { JournalEntree, Parcours, PratiquesSerie, Profile, Seance } from "@/lib/supabase/types";
import { titrePropre } from "@/lib/textes";

export type Bilan = {
  prenom: string;
  periode: string;
  intention: string;
  seances: { numero: number; date: string | null; mots: string[]; station: string | null }[];
  lettres: { titre: string; date: string | null }[];
  paroles: { date: string | null; texte: string }[];
};

// Le bilan de fin de cycle : chemin, mots, lettres, ce qu'elle a écrit. Rien n'est envoyé : Cloé le télécharge.
export async function chargerBilan(clienteId: string): Promise<Bilan | null> {
  const supabase = await createClient();
  const { data: profil } = await supabase.from("profiles").select("*").eq("id", clienteId).maybeSingle<Profile>();
  const { data: parcours } = await supabase.from("parcours").select("*").eq("cliente_id", clienteId).order("created_at", { ascending: false }).limit(1).maybeSingle<Parcours>();
  if (!profil || !parcours) return null;
  const [{ data: seances }, { data: lettres }, { data: carnet }] = await Promise.all([
    supabase.from("seances").select("*").eq("parcours_id", parcours.id).eq("statut", "faite").order("numero").returns<Seance[]>(),
    supabase.from("pratiques_series").select("titre, publiee_at").eq("parcours_id", parcours.id).not("publiee_at", "is", null).order("publiee_at").returns<Pick<PratiquesSerie, "titre" | "publiee_at">[]>(),
    supabase.from("journal").select("date, contenu").eq("cliente_id", clienteId).order("date", { ascending: false }).limit(12).returns<Pick<JournalEntree, "date" | "contenu">[]>(),
  ]);
  const faites = seances ?? [];
  const debut = debutDuParcours(parcours.date_debut, faites);
  const derniere = faites.at(-1)?.date;
  const date = (d: string | null | undefined) => (d && !avantOuverture(d) ? jourEtMois(d) : null);
  return {
    prenom: profil.prenom,
    periode: [debut ? moisAnnee(debut) : null, derniere ? moisAnnee(derniere) : null].filter(Boolean).join(" à "),
    intention: parcours.intention.trim(),
    seances: faites.map((s) => ({ numero: s.numero, date: date(s.date), mots: s.mots_cles, station: s.station_validee })),
    lettres: (lettres ?? []).map((l) => ({ titre: titrePropre(l.titre), date: date(l.publiee_at) })),
    paroles: (carnet ?? []).filter((e) => e.contenu.trim() && e.contenu !== "(un vocal)").reverse().map((e) => ({ date: date(e.date), texte: e.contenu.trim() })),
  };
}
