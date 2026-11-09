import "server-only";
import { aujourdhuiParis } from "@/lib/dates";
import { urlSignee } from "@/lib/fichiers";
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

export type EntreeCarnetComplete = JournalEntree & { exercice: string | null; lettre: { id: string; titre: string } | null };

// Le carnet, du plus récent au plus ancien, avec l'exercice et la lettre d'origine.
export async function entreesCarnet(clienteId: string, nombre?: number): Promise<EntreeCarnetComplete[]> {
  const supabase = await createClient();
  let requete = supabase
    .from("journal")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (nombre) requete = requete.limit(nombre);
  const { data } = await requete.returns<JournalEntree[]>();
  const entrees = data ?? [];
  const idsExercices = [...new Set(entrees.flatMap((e) => (e.pratique_id ? [e.pratique_id] : [])))];
  const idsLettres = [...new Set(entrees.flatMap((e) => (e.serie_id ? [e.serie_id] : [])))];
  const [{ data: exercices }, { data: lettres }] = await Promise.all([
    idsExercices.length ? supabase.from("pratiques").select("id, titre").in("id", idsExercices).returns<{ id: string; titre: string }[]>() : Promise.resolve({ data: [] as { id: string; titre: string }[] }),
    idsLettres.length ? supabase.from("pratiques_series").select("id, titre").in("id", idsLettres).returns<{ id: string; titre: string }[]>() : Promise.resolve({ data: [] as { id: string; titre: string }[] }),
  ]);
  return entrees.map((e) => ({
    ...e,
    exercice: exercices?.find((x) => x.id === e.pratique_id)?.titre ?? null,
    lettre: lettres?.find((x) => x.id === e.serie_id) ?? null,
  }));
}

// Une lettre complète : ses exercices, ce qu'elle y a écrit, et les lettres d'avant.
export async function maLettre(id: string, clienteId: string) {
  const supabase = await createClient();
  const { data: lettre } = await supabase.from("pratiques_series").select("*").eq("id", id).not("publiee_at", "is", null).maybeSingle<PratiquesSerie>();
  if (!lettre) return null;
  const [{ data: exercices }, { data: notes }, { data: avant }] = await Promise.all([
    supabase.from("pratiques").select("*").eq("serie_id", id).order("ordre").returns<Pratique[]>(),
    supabase.from("journal").select("*").eq("cliente_id", clienteId).eq("serie_id", id).order("created_at").returns<JournalEntree[]>(),
    supabase
      .from("pratiques_series")
      .select("id, titre, publiee_at")
      .eq("parcours_id", lettre.parcours_id)
      .not("publiee_at", "is", null)
      .lt("publiee_at", lettre.publiee_at!)
      .order("publiee_at", { ascending: false })
      .returns<{ id: string; titre: string; publiee_at: string }[]>(),
  ]);
  return { lettre, exercices: exercices ?? [], notes: notes ?? [], avant: avant ?? [] };
}

// Une séance à relire, et la lettre écrite après.
export async function maSeance(id: string) {
  const supabase = await createClient();
  const { data: seance } = await supabase.from("seances").select("*").eq("id", id).eq("statut", "faite").maybeSingle<Seance>();
  if (!seance) return null;
  const { data: lettre } = await supabase
    .from("pratiques_series")
    .select("id, titre")
    .eq("seance_id", id)
    .not("publiee_at", "is", null)
    .order("publiee_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; titre: string }>();
  return { seance, lettre };
}

// Les ressources prêtes à afficher, lien ouvert vers le fichier s'il y en a un.
export async function cartesRessources(parcoursId: string, clienteId: string) {
  const { affectations, ressources, suivis } = await mesRessources(parcoursId, clienteId);
  return Promise.all(
    affectations.flatMap((a) => {
      const r = ressources.find((x) => x.id === a.ressource_id);
      if (!r) return [];
      return [
        (async () => ({
          a,
          r,
          lien: r.url ?? (r.fichier_path ? await urlSignee("ressources", r.fichier_path) : null),
          statut: suivis.find((s) => s.affectation_id === a.id)?.statut ?? ("a_voir" as const),
        }))(),
      ];
    }),
  );
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

// Les notes personnalisées d'Émilien, à ouvrir depuis la mémoire.
export async function mesNotesEmilien(clienteId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("notes_emilien").select("id, titre, fichier_path").eq("cliente_id", clienteId).order("deposee_at", { ascending: false }).returns<{ id: string; titre: string; fichier_path: string }[]>();
  return Promise.all((data ?? []).map(async (n) => ({ id: n.id, titre: n.titre, url: await urlSignee("notes", n.fichier_path) })));
}
