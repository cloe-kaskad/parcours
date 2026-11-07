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
  created_at: string;
  updated_at: string;
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
  mots_cles_proposes: string[];
  created_at: string;
  updated_at: string;
};

export type PratiquesSerie = {
  id: string;
  parcours_id: string;
  seance_id: string | null;
  titre: string;
  intro: string;
  signature: string;
  publiee_at: string | null;
  created_at: string;
  updated_at: string;
};
