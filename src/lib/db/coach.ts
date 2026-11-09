import "server-only";
import { etatSeance, transcriptPret } from "@/lib/agenda";
import { avantOuverture } from "@/lib/dates";
import { urlSignee } from "@/lib/fichiers";
import { createClient } from "@/lib/supabase/server";
import type { JournalEntree, Meteo, Parcours, PratiquesSerie, Profile, Ressource, RessourceAffectation, RessourceSuivi, Retour, Seance } from "@/lib/supabase/types";

export type NoteEmilien = { id: string; cliente_id: string; titre: string; fichier_path: string; deposee_at: string };

// L'agenda : toutes les séances des clientes actives, avec leurs trois points.
export async function chargerAgenda() {
  const supabase = await createClient();
  const [{ data: clientes }, { data: parcours }, { data: seances }, { data: lettres }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "cliente").eq("actif", true).order("prenom").returns<Profile[]>(),
    supabase.from("parcours").select("*").returns<Parcours[]>(),
    supabase.from("seances").select("*").order("date", { ascending: true }).returns<Seance[]>(),
    supabase.from("pratiques_series").select("seance_id").not("publiee_at", "is", null).returns<{ seance_id: string | null }[]>(),
  ]);
  const envoyees = new Set((lettres ?? []).map((l) => l.seance_id));
  const lignes = (seances ?? []).flatMap((seance) => {
    const p = parcours?.find((x) => x.id === seance.parcours_id);
    const cliente = p && clientes?.find((c) => c.id === p.cliente_id);
    if (!p || !cliente) return [];
    return [{ seance, cliente, pause: p.statut !== "actif", etat: etatSeance(seance, envoyees.has(seance.id)) }];
  });
  const choix = (clientes ?? []).flatMap((c) => {
    const p = parcours?.find((x) => x.cliente_id === c.id);
    return p ? [{ parcoursId: p.id, prenom: c.prenom }] : [];
  });
  return { lignes, choix };
}

export async function listeClientes() {
  const supabase = await createClient();
  const [{ data: clientes }, { data: parcours }, { data: seances }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "cliente").order("prenom").returns<Profile[]>(),
    supabase.from("parcours").select("id, cliente_id").returns<Pick<Parcours, "id" | "cliente_id">[]>(),
    supabase.from("seances").select("parcours_id, statut").returns<Pick<Seance, "parcours_id" | "statut">[]>(),
  ]);
  return (clientes ?? []).map((c) => {
    const p = parcours?.find((x) => x.cliente_id === c.id);
    return { ...c, vecues: (seances ?? []).filter((s) => s.parcours_id === p?.id && s.statut === "faite").length };
  });
}

// Ce que la fiche ajoute à ce que voit la cliente.
export async function complementFiche(clienteId: string, parcoursId: string | null) {
  const supabase = await createClient();
  const [{ data: profil }, { data: notes }, { data: bibliotheque }, { data: brouillons }, { data: toutes }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", clienteId).maybeSingle<Profile>(),
    supabase.from("notes_emilien").select("*").eq("cliente_id", clienteId).order("deposee_at", { ascending: false }).returns<NoteEmilien[]>(),
    supabase.from("ressources").select("*").eq("en_attente", false).order("titre").returns<Ressource[]>(),
    parcoursId ? supabase.from("pratiques_series").select("id, titre").eq("parcours_id", parcoursId).is("publiee_at", null).returns<{ id: string; titre: string }[]>() : Promise.resolve({ data: [] as { id: string; titre: string }[] }),
    parcoursId ? supabase.from("seances").select("*").eq("parcours_id", parcoursId).order("numero", { ascending: false }).returns<Seance[]>() : Promise.resolve({ data: [] as Seance[] }),
  ]);
  return { profil, notes: notes ?? [], bibliotheque: bibliotheque ?? [], brouillons: brouillons ?? [], seances: toutes ?? [] };
}

async function clienteDuParcours(parcoursId: string) {
  const supabase = await createClient();
  const { data: parcours } = await supabase.from("parcours").select("*").eq("id", parcoursId).maybeSingle<Parcours>();
  if (!parcours) return null;
  const { data: cliente } = await supabase.from("profiles").select("*").eq("id", parcours.cliente_id).maybeSingle<Profile>();
  return cliente ? { parcours, cliente } : null;
}

export async function chargerSeanceCoach(seanceId: string) {
  const supabase = await createClient();
  const { data: seance } = await supabase.from("seances").select("*").eq("id", seanceId).maybeSingle<Seance>();
  if (!seance) return null;
  const qui = await clienteDuParcours(seance.parcours_id);
  if (!qui) return null;
  const [{ data: transcription }, { data: retours }, { data: lettres }, audio, pdf] = await Promise.all([
    supabase.from("transcriptions").select("statut, erreur").eq("seance_id", seanceId).order("created_at", { ascending: false }).limit(1).maybeSingle<{ statut: string; erreur: string | null }>(),
    supabase.from("retours").select("*").eq("seance_id", seanceId).not("envoye_at", "is", null).order("created_at").returns<Retour[]>(),
    supabase.from("pratiques_series").select("*").eq("seance_id", seanceId).order("created_at", { ascending: false }).returns<PratiquesSerie[]>(),
    seance.audio_path ? urlSignee("audio", seance.audio_path) : Promise.resolve(null),
    seance.transcript_pdf_path ? urlSignee("transcripts", seance.transcript_pdf_path) : Promise.resolve(null),
  ]);
  return { seance, ...qui, transcription, retours: retours ?? [], lettres: lettres ?? [], audio, pdf };
}

// Le texte d'une séance en une seule chaîne, pour les volets de lecture.
export function texteSeance(s: Seance) {
  if (s.transcript_segments?.length) return s.transcript_segments.map((t) => `${t.locuteur} : ${t.texte}`).join("\n\n");
  return s.transcript_formate ?? "";
}

export async function chargerLettreCoach(lettreId: string) {
  const supabase = await createClient();
  const { data: lettre } = await supabase.from("pratiques_series").select("*").eq("id", lettreId).maybeSingle<PratiquesSerie>();
  if (!lettre) return null;
  const qui = await clienteDuParcours(lettre.parcours_id);
  if (!qui) return null;
  const [{ data: seances }, { data: carnet }] = await Promise.all([
    supabase.from("seances").select("*").eq("parcours_id", lettre.parcours_id).eq("statut", "faite").order("numero", { ascending: false }).returns<Seance[]>(),
    supabase.from("journal").select("*").eq("cliente_id", qui.cliente.id).order("date", { ascending: false }).limit(10).returns<JournalEntree[]>(),
  ]);
  const seance = seances?.find((s) => s.id === lettre.seance_id) ?? seances?.[0] ?? null;
  const { data: retours } = seance ? await supabase.from("retours").select("*").eq("seance_id", seance.id).not("envoye_at", "is", null).order("created_at", { ascending: false }).returns<Retour[]>() : { data: [] as Retour[] };
  return { lettre, ...qui, seance, retours: retours ?? [], carnet: carnet ?? [] };
}

export async function chargerAvant(seanceId: string, peutVoirPreparation: boolean) {
  const supabase = await createClient();
  const { data: seance } = await supabase.from("seances").select("*").eq("id", seanceId).maybeSingle<Seance>();
  if (!seance) return null;
  const qui = await clienteDuParcours(seance.parcours_id);
  if (!qui) return null;
  const clienteId = qui.cliente.id;
  const { data: precedentes } = await supabase.from("seances").select("*").eq("parcours_id", seance.parcours_id).eq("statut", "faite").lt("numero", seance.numero).order("numero", { ascending: false }).limit(1).returns<Seance[]>();
  const precedente = precedentes?.[0] ?? null;
  const [{ data: carnet }, { data: meteos }, { data: etats }, { data: lettres }, { data: retours }, { data: affectations }, { data: suivis }, preparation] = await Promise.all([
    supabase.from("journal").select("*").eq("cliente_id", clienteId).order("date", { ascending: false }).order("created_at", { ascending: false }).returns<JournalEntree[]>(),
    supabase.from("meteo").select("*").eq("cliente_id", clienteId).order("date", { ascending: false }).limit(6).returns<Meteo[]>(),
    supabase.from("meteo_etats").select("code, libelle").returns<{ code: string; libelle: string }[]>(),
    supabase.from("pratiques_series").select("*").eq("parcours_id", seance.parcours_id).not("publiee_at", "is", null).order("publiee_at", { ascending: false }).limit(1).returns<PratiquesSerie[]>(),
    precedente ? supabase.from("retours").select("*").eq("seance_id", precedente.id).not("envoye_at", "is", null).order("created_at", { ascending: false }).returns<Retour[]>() : Promise.resolve({ data: [] as Retour[] }),
    supabase.from("ressources_affectations").select("*").eq("parcours_id", seance.parcours_id).returns<RessourceAffectation[]>(),
    supabase.from("ressources_suivi").select("*").eq("cliente_id", clienteId).returns<RessourceSuivi[]>(),
    peutVoirPreparation ? supabase.from("seances_preparations").select("contenu").eq("seance_id", seanceId).maybeSingle<{ contenu: string }>() : Promise.resolve({ data: null }),
  ]);
  const ids = (affectations ?? []).map((a) => a.ressource_id);
  const { data: ressources } = ids.length ? await supabase.from("ressources").select("*").in("id", ids).returns<Ressource[]>() : { data: [] as Ressource[] };
  return { seance, ...qui, precedente, carnet: carnet ?? [], meteos: meteos ?? [], etats: etats ?? [], lettre: lettres?.[0] ?? null, retours: retours ?? [], affectations: affectations ?? [], suivis: suivis ?? [], ressources: ressources ?? [], preparation: preparation.data?.contenu ?? "" };
}

export async function chargerBibliotheque() {
  const supabase = await createClient();
  const [{ data: ressources }, { data: affectations }, { data: parcours }, { data: clientes }] = await Promise.all([
    supabase.from("ressources").select("*").order("created_at", { ascending: false }).returns<Ressource[]>(),
    supabase.from("ressources_affectations").select("id, ressource_id, parcours_id").returns<Pick<RessourceAffectation, "id" | "ressource_id" | "parcours_id">[]>(),
    supabase.from("parcours").select("id, cliente_id").returns<Pick<Parcours, "id" | "cliente_id">[]>(),
    supabase.from("profiles").select("id, prenom").eq("role", "cliente").eq("actif", true).order("prenom").returns<Pick<Profile, "id" | "prenom">[]>(),
  ]);
  const prenomDe = (parcoursId: string) => clientes?.find((c) => c.id === parcours?.find((p) => p.id === parcoursId)?.cliente_id)?.prenom;
  return {
    ressources: (ressources ?? []).map((r) => ({
      ...r,
      partages: (affectations ?? []).filter((a) => a.ressource_id === r.id).flatMap((a) => (prenomDe(a.parcours_id) ? [prenomDe(a.parcours_id)!] : [])),
    })),
    choix: (clientes ?? []).flatMap((c) => {
      const p = parcours?.find((x) => x.cliente_id === c.id);
      return p ? [{ parcoursId: p.id, prenom: c.prenom }] : [];
    }),
  };
}

// « À lire » : les séances au transcript prêt, sans retour envoyé, la plus ancienne d'abord.
// Les séances reprises de Notion ne sont pas dans la pile : elles sont rangées dans « Déjà traitées ».
export async function chargerALire(auteurId: string) {
  const supabase = await createClient();
  const [{ data: seances }, { data: retours }, { data: parcours }, { data: clientes }] = await Promise.all([
    supabase.from("seances").select("*").eq("statut", "faite").order("date", { ascending: true }).returns<Seance[]>(),
    supabase.from("retours").select("seance_id").eq("auteur_id", auteurId).not("envoye_at", "is", null).returns<{ seance_id: string }[]>(),
    supabase.from("parcours").select("id, cliente_id").returns<Pick<Parcours, "id" | "cliente_id">[]>(),
    supabase.from("profiles").select("id, prenom").eq("role", "cliente").eq("actif", true).returns<Pick<Profile, "id" | "prenom">[]>(),
  ]);
  const envoyes = new Set((retours ?? []).map((r) => r.seance_id));
  const lignes = (seances ?? []).filter(transcriptPret).flatMap((seance) => {
    const clienteId = parcours?.find((p) => p.id === seance.parcours_id)?.cliente_id;
    const prenom = clientes?.find((c) => c.id === clienteId)?.prenom;
    return prenom ? [{ seance, prenom, envoye: envoyes.has(seance.id) }] : [];
  });
  const recente = (s: Seance) => Boolean(s.date) && !avantOuverture(s.date);
  return { aLire: lignes.filter((l) => !l.envoye && recente(l.seance)), traitees: lignes.filter((l) => l.envoye || !recente(l.seance)).reverse() };
}

export async function chargerLecture(seanceId: string, auteurId: string) {
  const supabase = await createClient();
  const { data: seance } = await supabase.from("seances").select("*").eq("id", seanceId).maybeSingle<Seance>();
  if (!seance) return null;
  const qui = await clienteDuParcours(seance.parcours_id);
  if (!qui) return null;
  const [{ data: retour }, audio, pdf] = await Promise.all([
    supabase.from("retours").select("*").eq("seance_id", seanceId).eq("auteur_id", auteurId).maybeSingle<Retour>(),
    seance.audio_path ? urlSignee("audio", seance.audio_path) : Promise.resolve(null),
    seance.transcript_pdf_path ? urlSignee("transcripts", seance.transcript_pdf_path) : Promise.resolve(null),
  ]);
  return { seance, cliente: qui.cliente, retour, audio, pdf };
}
