// Types des tables utilisées côté application.
// À remplacer par les types générés (`npm run db:types`) quand la CLI Supabase sera branchée.

export type Role = "cliente" | "coach" | "relecteur";

export type Profile = {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: Role;
  programme_id: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type Parcours = {
  id: string;
  cliente_id: string;
  programme_id: string;
  intention: string;
  mots_cles: string[];
  date_debut: string | null;
  statut: "actif" | "pause" | "termine";
  couverture_path: string | null;
  drive_folder_id: string | null;
  drive_folder_nom: string | null;
  created_at: string;
  updated_at: string;
};

export type Etape = {
  id: string;
  parcours_id: string;
  ordre: number;
  titre: string;
  mots_cles: string[];
  moments_forts: string;
  statut: "a_venir" | "en_cours" | "traversee";
};

export type Seance = {
  id: string;
  parcours_id: string;
  numero: number;
  date: string | null;
  duree_min: number;
  etape_id: string | null;
  statut: "planifiee" | "faite" | "annulee";
  audio_path: string | null;
  transcript_formate: string | null;
  transcript_pdf_path: string | null;
  transcript_statut: "aucun" | "en_cours" | "pret" | "erreur";
  transcript_erreur: string | null;
  envoye_emilien_at: string | null;
  calendar_event_id: string | null;
  mots_proposes: string[];
  audio_duree_sec: number | null;
  audio_source: "drive" | "depot" | null;
  mots_cles: string[];
  station_proposee: string | null;
  station_validee: string | null;
  transcript_segments: { locuteur: string; debut: number; texte: string }[] | null;
  emilien_notifie_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Retour = {
  id: string;
  seance_id: string;
  auteur_id: string;
  contenu: string;
  // Version mise en forme (intertitres, listes), mêmes mots que contenu ; effacée si contenu change.
  contenu_lisible: string | null;
  contenu_lisible_at: string | null;
  envoye_at: string | null;
  ressource_proposee_url: string | null;
  ressource_proposee_mot: string | null;
  fichier_path: string | null;
  source: Source;
  created_at: string;
  updated_at: string;
};

// D'où vient un retour ou une préparation : écrit sur la plateforme ou importé du Drive.
export type Source = "plateforme" | "drive";

// « Ma préparation » : Cloé seule.
export type SeancePreparation = {
  seance_id: string;
  contenu: string;
  fichier_path: string | null;
  source: Source;
  updated_at: string;
};

// Note de parcours de l'équipe : jamais visible par la cliente (table à part, voir 0004).
export type NoteEquipe = {
  parcours_id: string;
  note_equipe: string;
  note_equipe_modifiee_par: string | null;
  note_equipe_modifiee_at: string;
};

export type PratiquesSerie = {
  id: string;
  parcours_id: string;
  seance_id: string | null;
  titre: string;
  intro: string;
  signature: string;
  contenu: string;
  publiee_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Pratique = {
  id: string;
  serie_id: string;
  ordre: number;
  titre: string;
  accroche: string;
  consigne: string;
  regles: string;
  pourquoi: string;
  bonus: boolean;
  slug: string | null;
};

export type Reponse = {
  id: string;
  pratique_id: string;
  cliente_id: string;
  contenu: string;
  photos: string[];
  created_at: string;
  updated_at: string;
};

export type RessourceType = "podcast" | "video" | "lecture" | "film" | "pdf" | "autre";

export type Ressource = {
  id: string;
  type: RessourceType;
  titre: string;
  auteur: string;
  url: string | null;
  fichier_path: string | null;
  description: string;
  image_url: string | null;
  source: "cloe" | "emilien";
  en_attente: boolean;
  created_at: string;
};

export type RessourceAffectation = {
  id: string;
  ressource_id: string;
  parcours_id: string;
  seance_id: string | null;
  pourquoi: string;
  publiee_at: string | null;
  created_at: string;
};

export type RessourceSuivi = {
  id: string;
  affectation_id: string;
  cliente_id: string;
  statut: "a_voir" | "commence" | "termine";
  position_sec: number | null;
};

export type JournalEntree = {
  id: string;
  cliente_id: string;
  date: string;
  contenu: string;
  pour_prochaine_seance: boolean;
  pratique_id: string | null;
  serie_id: string | null;
  // Posée par Cloé seule (marquer_carnet_vu), retombe quand la cliente modifie son texte.
  vu_par_coach_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Meteo = {
  id: string;
  cliente_id: string;
  date: string;
  etat_code: string;
  note: string;
  created_at: string;
};

export const TYPES_RESSOURCE: { valeur: RessourceType; libelle: string }[] = [
  { valeur: "podcast", libelle: "Podcast" },
  { valeur: "video", libelle: "Vidéo" },
  { valeur: "lecture", libelle: "Lecture" },
  { valeur: "film", libelle: "Film" },
  { valeur: "pdf", libelle: "PDF" },
  { valeur: "autre", libelle: "Autre" },
];
