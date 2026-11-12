import "server-only";
import { etatSeance, transcriptPret } from "@/lib/agenda";
import { avantOuverture } from "@/lib/dates";
import { urlSignee } from "@/lib/fichiers";
import { createClient } from "@/lib/supabase/server";
import type { JournalEntree, Meteo, NoteEquipe, Parcours, Pratique, PratiquesSerie, Profile, Ressource, RessourceAffectation, RessourceSuivi, Retour, Seance, SeancePreparation } from "@/lib/supabase/types";

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
  const lettre = lettres?.[0] ?? null;
  const [{ data: ressources }, { data: exercices }, { data: note }, { data: faites }, preparationPrecedente] = await Promise.all([
    ids.length ? supabase.from("ressources").select("*").in("id", ids).returns<Ressource[]>() : Promise.resolve({ data: [] as Ressource[] }),
    lettre ? supabase.from("pratiques").select("*").eq("serie_id", lettre.id).order("ordre").returns<Pratique[]>() : Promise.resolve({ data: [] as Pratique[] }),
    supabase.from("parcours_notes_equipe").select("*").eq("parcours_id", seance.parcours_id).maybeSingle<NoteEquipe>(),
    supabase.from("seances").select("*").eq("parcours_id", seance.parcours_id).eq("statut", "faite").order("numero").returns<Seance[]>(),
    peutVoirPreparation && precedente ? supabase.from("seances_preparations").select("contenu").eq("seance_id", precedente.id).maybeSingle<{ contenu: string }>() : Promise.resolve({ data: null }),
  ]);
  return {
    seance,
    ...qui,
    precedente,
    carnet: carnet ?? [],
    meteos: meteos ?? [],
    etats: etats ?? [],
    lettre,
    exercices: exercices ?? [],
    retours: retours ?? [],
    affectations: affectations ?? [],
    suivis: suivis ?? [],
    ressources: ressources ?? [],
    preparation: preparation.data?.contenu ?? "",
    preparationPrecedente: preparationPrecedente.data?.contenu ?? "",
    noteEquipe: note?.note_equipe ?? "",
    seancesFaites: faites ?? [],
  };
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

// ---------------------------------------------------------------------------
// La vue équipe d'une cliente (docs/04, section 3)
// ---------------------------------------------------------------------------
export type ObjetsSeance = {
  audio: string | null;
  pdf: string | null;
  enCours: boolean;
  retours: (Retour & { pdf: string | null })[];
  monRetour: Retour | null;
  preparation: { contenu: string; pdf: string | null } | null;
  lettre: PratiquesSerie | null;
  brouillon: PratiquesSerie | null;
};

export async function chargerVueEquipe(clienteId: string, moi: Profile) {
  const supabase = await createClient();
  const estCoach = moi.role === "coach";
  const [{ data: profil }, { data: parcoursListe }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", clienteId).maybeSingle<Profile>(),
    supabase.from("parcours").select("*").eq("cliente_id", clienteId).order("created_at", { ascending: false }).limit(1).returns<Parcours[]>(),
  ]);
  if (!profil || profil.role !== "cliente") return null;
  const parcours = parcoursListe?.[0] ?? null;
  const pid = parcours?.id ?? "00000000-0000-0000-0000-000000000000";

  const [{ data: seances }, { data: lettres }, { data: note }, { data: notes }, { data: aborder }, { data: recents }, { data: bibliotheque }, { data: equipe }] = await Promise.all([
    supabase.from("seances").select("*").eq("parcours_id", pid).order("numero", { ascending: false }).returns<Seance[]>(),
    supabase.from("pratiques_series").select("*").eq("parcours_id", pid).order("created_at", { ascending: false }).returns<PratiquesSerie[]>(),
    supabase.from("parcours_notes_equipe").select("*").eq("parcours_id", pid).maybeSingle<NoteEquipe>(),
    supabase.from("notes_emilien").select("*").eq("cliente_id", clienteId).order("deposee_at", { ascending: false }).returns<NoteEmilien[]>(),
    supabase.from("journal").select("*").eq("cliente_id", clienteId).eq("pour_prochaine_seance", true).order("date", { ascending: false }).returns<JournalEntree[]>(),
    supabase.from("journal").select("*").eq("cliente_id", clienteId).eq("pour_prochaine_seance", false).order("date", { ascending: false }).order("created_at", { ascending: false }).limit(3).returns<JournalEntree[]>(),
    estCoach ? supabase.from("ressources").select("*").eq("en_attente", false).order("titre").returns<Ressource[]>() : Promise.resolve({ data: [] as Ressource[] }),
    supabase.from("profiles").select("id, prenom").in("role", ["coach", "relecteur"]).returns<Pick<Profile, "id" | "prenom">[]>(),
  ]);
  const liste = seances ?? [];
  const ids = liste.map((s) => s.id);
  const [{ data: retours }, { data: preparations }, { data: transcriptions }] = await Promise.all([
    ids.length ? supabase.from("retours").select("*").in("seance_id", ids).order("created_at").returns<Retour[]>() : Promise.resolve({ data: [] as Retour[] }),
    estCoach && ids.length ? supabase.from("seances_preparations").select("*").in("seance_id", ids).returns<SeancePreparation[]>() : Promise.resolve({ data: [] as SeancePreparation[] }),
    ids.length ? supabase.from("transcriptions").select("seance_id, statut, created_at").in("seance_id", ids).order("created_at", { ascending: false }).returns<{ seance_id: string; statut: string }[]>() : Promise.resolve({ data: [] as { seance_id: string; statut: string }[] }),
  ]);

  const objets = new Map<string, ObjetsSeance>();
  await Promise.all(
    liste.map(async (s) => {
      const lesRetours = (retours ?? []).filter((r) => r.seance_id === s.id);
      const envoyes = lesRetours.filter((r) => r.envoye_at);
      const prep = (preparations ?? []).find((p) => p.seance_id === s.id);
      const statut = (transcriptions ?? []).find((t) => t.seance_id === s.id)?.statut;
      const [audio, pdf, retoursPdf, prepPdf] = await Promise.all([
        s.audio_path ? urlSignee("audio", s.audio_path) : null,
        s.transcript_pdf_path ? urlSignee("transcripts", s.transcript_pdf_path) : null,
        Promise.all(envoyes.map(async (r) => ({ ...r, pdf: r.fichier_path ? await urlSignee("retours", r.fichier_path) : null }))),
        prep?.fichier_path ? urlSignee("preparations", prep.fichier_path) : null,
      ]);
      const deLaSeance = (lettres ?? []).filter((l) => l.seance_id === s.id);
      objets.set(s.id, {
        audio,
        pdf,
        enCours: statut === "en_cours" || statut === "en_attente",
        retours: retoursPdf,
        monRetour: lesRetours.find((r) => r.auteur_id === moi.id) ?? null,
        preparation: prep && (prep.contenu.trim() || prepPdf) ? { contenu: prep.contenu, pdf: prepPdf } : null,
        lettre: deLaSeance.find((l) => l.publiee_at) ?? null,
        brouillon: deLaSeance.find((l) => !l.publiee_at) ?? null,
      });
    }),
  );

  const notesAvecLien = await Promise.all((notes ?? []).map(async (n) => ({ ...n, lien: await urlSignee("notes", n.fichier_path) })));
  const auteurNote = note?.note_equipe_modifiee_par ? (equipe ?? []).find((p) => p.id === note.note_equipe_modifiee_par)?.prenom ?? null : null;
  const envoyees = new Set((lettres ?? []).filter((l) => l.publiee_at).map((l) => l.seance_id));

  return {
    profil,
    parcours,
    seances: liste,
    objets,
    envoyees,
    note: note ? { ...note, auteur: auteurNote } : null,
    notes: notesAvecLien,
    carnet: { aborder: aborder ?? [], recents: recents ?? [] },
    bibliotheque: bibliotheque ?? [],
  };
}
