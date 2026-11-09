import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  Etape,
  JournalEntree,
  Meteo,
  Parcours,
  Pratique,
  PratiquesSerie,
  Profile,
  Reponse,
  Ressource,
  RessourceAffectation,
  Retour,
  Seance,
} from "@/lib/supabase/types";

export async function chargerCliente(clienteId: string) {
  const supabase = await createClient();
  const [{ data: profil }, { data: parcours }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", clienteId).maybeSingle<Profile>(),
    supabase
      .from("parcours")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<Parcours>(),
  ]);
  if (!profil) return null;

  const parcoursId = parcours?.id;
  const [seances, series, affectations, ressources, journal, meteos, etapes] = parcoursId
    ? await Promise.all([
        supabase.from("seances").select("*").eq("parcours_id", parcoursId).order("numero").returns<Seance[]>(),
        supabase
          .from("pratiques_series")
          .select("*")
          .eq("parcours_id", parcoursId)
          .order("created_at", { ascending: false })
          .returns<PratiquesSerie[]>(),
        supabase
          .from("ressources_affectations")
          .select("*")
          .eq("parcours_id", parcoursId)
          .order("created_at", { ascending: false })
          .returns<RessourceAffectation[]>(),
        supabase.from("ressources").select("*").order("titre").returns<Ressource[]>(),
        supabase
          .from("journal")
          .select("*")
          .eq("cliente_id", clienteId)
          .order("date", { ascending: false })
          .limit(20)
          .returns<JournalEntree[]>(),
        supabase
          .from("meteo")
          .select("*")
          .eq("cliente_id", clienteId)
          .order("date", { ascending: false })
          .limit(14)
          .returns<Meteo[]>(),
        supabase.from("etapes").select("*").eq("parcours_id", parcoursId).order("ordre").returns<Etape[]>(),
      ])
    : [];

  return {
    profil,
    parcours,
    seances: seances?.data ?? [],
    series: series?.data ?? [],
    affectations: affectations?.data ?? [],
    ressources: ressources?.data ?? [],
    journal: journal?.data ?? [],
    meteos: meteos?.data ?? [],
    etapes: etapes?.data ?? [],
  };
}

export async function chargerSeance(seanceId: string) {
  const supabase = await createClient();
  const { data: seance } = await supabase.from("seances").select("*").eq("id", seanceId).maybeSingle<Seance>();
  if (!seance) return null;
  const [{ data: retours }, { data: auteurs }, { data: series }] = await Promise.all([
    supabase.from("retours").select("*").eq("seance_id", seanceId).order("created_at").returns<Retour[]>(),
    supabase.from("profiles").select("id, prenom").in("role", ["coach", "relecteur"]).returns<Pick<Profile, "id" | "prenom">[]>(),
    supabase.from("pratiques_series").select("*").eq("seance_id", seanceId).returns<PratiquesSerie[]>(),
  ]);
  return { seance, retours: retours ?? [], auteurs: auteurs ?? [], series: series ?? [] };
}

export async function chargerSerie(serieId: string) {
  const supabase = await createClient();
  const { data: serie } = await supabase.from("pratiques_series").select("*").eq("id", serieId).maybeSingle<PratiquesSerie>();
  if (!serie) return null;
  const [{ data: pratiques }, { data: seances }] = await Promise.all([
    supabase.from("pratiques").select("*").eq("serie_id", serieId).order("ordre").returns<Pratique[]>(),
    supabase.from("seances").select("*").eq("parcours_id", serie.parcours_id).order("numero").returns<Seance[]>(),
  ]);
  const ids = (pratiques ?? []).map((p) => p.id);
  const { data: reponses } = ids.length
    ? await supabase.from("journal").select("id, pratique_id, cliente_id, contenu, created_at, updated_at").in("pratique_id", ids).returns<Reponse[]>()
    : { data: [] as Reponse[] };
  return { serie, pratiques: pratiques ?? [], seances: seances ?? [], reponses: reponses ?? [] };
}
