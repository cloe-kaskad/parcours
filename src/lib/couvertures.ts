// Les couvertures. Un chemin commençant par « / » vient de la banque (public/couvertures),
// sinon c'est une image déposée dans le bucket « couvertures ».
export const BANQUE_COUVERTURES = [
  { chemin: "/couvertures/lumiere-sur-la-mer.jpg", nom: "Lumière sur la mer" },
  { chemin: "/couvertures/matiere-chaude.jpg", nom: "Matière chaude" },
  { chemin: "/couvertures/lumiere-de-fenetre.jpg", nom: "Lumière de fenêtre" },
  { chemin: "/couvertures/fil-rouge.jpg", nom: "Fil rouge" },
  { chemin: "/couvertures/deux-cercles.jpg", nom: "Deux cercles" },
];

export function urlCouverture(chemin: string | null) {
  if (chemin?.startsWith("/")) return chemin;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()}/storage/v1/object/public/couvertures/${chemin ?? "defaut.jpg"}`;
}

// Accepte l'identifiant d'un dossier Drive, ou le lien entier.
export function identifiantDrive(saisie: string) {
  return /folders\/([\w-]+)/.exec(saisie)?.[1] ?? (saisie.trim() || null);
}
