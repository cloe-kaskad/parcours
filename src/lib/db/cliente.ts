import "server-only";
import { aujourdhuiParis } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type {
  JournalEntree,
  Meteo,
  Parcours,
  Pratique,
  PratiquesSerie,
  Ressource,
  RessourceAffectation,
  RessourceSuivi,
  Seance,
} from "@/lib/supabase/types";

export async function monParcours(clienteId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parcours")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Parcours>();
  return data;
}

export async function mesSeances(parcoursId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("seances").select("*").eq("parcours_id", parcoursId).order("numero").returns<Seance[]>();
  return data ?? [];
}

// La lettre en cours : la dernière rendue visible, ses exercices et ceux où elle a écrit.
export async function lettreEnCours(parcoursId: string, clienteId: string) {
  const supabase = await createClient();
  const { data: lettre } = await supabase
    .from("pratiques_series")
    .select("*")
    .eq("parcours_id", parcoursId)
    .not("publiee_at", "is", null)
    .order("publiee_at", { ascending: false })
    .limit(1)
    .maybeSingle<PratiquesSerie>();
  if (!lettre) return null;
  const { data: exercices } = await supabase.from("pratiques").select("*").eq("serie_id", lettre.id).order("ordre").returns<Pratique[]>();
  const ids = (exercices ?? []).map((e) => e.id);
  const { data: notes } = ids.length
    ? await supabase.from("journal").select("pratique_id").eq("cliente_id", clienteId).in("pratique_id", ids).returns<{ pratique_id: string }[]>()
    : { data: [] };
  return { lettre, exercices: exercices ?? [], ecrits: new Set((notes ?? []).map((n) => n.pratique_id)) };
}

export async function mesRessources(parcoursId: string, clienteId: string) {
  const supabase = await createClient();
  const { data: affectations } = await supabase
    .from("ressources_affectations")
    .select("*")
    .eq("parcours_id", parcoursId)
    .not("publiee_at", "is", null)
    .order("publiee_at", { ascending: false })
    .returns<RessourceAffectation[]>();
  const rids = (affectations ?? []).map((a) => a.ressource_id);
  const aids = (affectations ?? []).map((a) => a.id);
  const [{ data: ressources }, { data: suivis }] = rids.length
    ? await Promise.all([
        supabase.from("ressources").select("*").in("id", rids).returns<Ressource[]>(),
        supabase.from("ressources_suivi").select("*").eq("cliente_id", clienteId).in("affectation_id", aids).returns<RessourceSuivi[]>(),
      ])
    : [{ data: [] as Ressource[] }, { data: [] as RessourceSuivi[] }];
  return { affectations: affectations ?? [], ressources: ressources ?? [], suivis: suivis ?? [] };
}

export type EntreeAvecExercice = JournalEntree & { exercice: string | null };

// Les dernières entrées du carnet, avec le titre de l'exercice d'origine.
export async function carnetRecent(clienteId: string, nombre = 3): Promise<EntreeAvecExercice[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("journal")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(nombre)
    .returns<JournalEntree[]>();
  const entrees = data ?? [];
  const ids = [...new Set(entrees.flatMap((e) => (e.pratique_id ? [e.pratique_id] : [])))];
  const { data: exercices } = ids.length
    ? await supabase.from("pratiques").select("id, titre").in("id", ids).returns<{ id: string; titre: string }[]>()
    : { data: [] };
  return entrees.map((e) => ({ ...e, exercice: exercices?.find((x) => x.id === e.pratique_id)?.titre ?? null }));
}

export type MeteoEtat = { code: string; libelle: string; ordre: number; actif: boolean };
export type Musique = { id: string; etat_code: string; titre: string; artiste: string; url: string; ordre: number };

export async function meteoDuJour(clienteId: string) {
  const supabase = await createClient();
  const date = aujourdhuiParis();
  const [{ data: etats }, { data: meteo }, { data: traces }, { data: musiques }] = await Promise.all([
    supabase.from("meteo_etats").select("*").eq("actif", true).order("ordre").returns<MeteoEtat[]>(),
    supabase.from("meteo").select("*").eq("cliente_id", clienteId).eq("date", date).maybeSingle<Meteo>(),
    supabase.from("meteo").select("*").eq("cliente_id", clienteId).lt("date", date).order("date", { ascending: false }).limit(3).returns<Meteo[]>(),
    supabase.from("musiques").select("*").order("ordre").returns<Musique[]>(),
  ]);
  return { etats: etats ?? [], meteo, traces: traces ?? [], musiques: musiques ?? [] };
}
