import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  Etape,
  JournalEntree,
  Parcours,
  Pratique,
  PratiquesSerie,
  Reponse,
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

export async function mesEtapes(parcoursId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("etapes").select("*").eq("parcours_id", parcoursId).order("ordre").returns<Etape[]>();
  return data ?? [];
}

export async function mesSeries(parcoursId: string, clienteId: string) {
  const supabase = await createClient();
  const { data: series } = await supabase
    .from("pratiques_series")
    .select("*")
    .eq("parcours_id", parcoursId)
    .not("publiee_at", "is", null)
    .order("publiee_at", { ascending: false })
    .returns<PratiquesSerie[]>();
  const ids = (series ?? []).map((s) => s.id);
  if (!ids.length) return { series: [] as PratiquesSerie[], pratiques: [] as Pratique[], reponses: [] as Reponse[] };
  const { data: pratiques } = await supabase.from("pratiques").select("*").in("serie_id", ids).order("ordre").returns<Pratique[]>();
  const pids = (pratiques ?? []).map((p) => p.id);
  const { data: reponses } = pids.length
    ? await supabase.from("reponses").select("*").eq("cliente_id", clienteId).in("pratique_id", pids).returns<Reponse[]>()
    : { data: [] as Reponse[] };
  return { series: series ?? [], pratiques: pratiques ?? [], reponses: reponses ?? [] };
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

export async function monJournal(clienteId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("journal")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<JournalEntree[]>();
  return data ?? [];
}
