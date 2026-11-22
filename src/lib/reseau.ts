// Écrire sans réseau n'est pas prévu (brief du 22 novembre) : un message clair, et rien n'est perdu
// de ce qui est en cours de saisie. Toute écriture côté cliente passe par ici.
export const MESSAGE_HORS_LIGNE = "Pas de réseau pour l’instant. Rien n’est perdu : ce que tu as écrit reste là, réessaie quand le réseau revient.";

export async function avecReseau<T>(appel: () => Promise<T>): Promise<{ ok: true; valeur: T } | { ok: false; message: string }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ok: false, message: MESSAGE_HORS_LIGNE };
  try {
    return { ok: true, valeur: await appel() };
  } catch {
    const enLigne = typeof navigator === "undefined" || navigator.onLine;
    return { ok: false, message: enLigne ? "Ça n’a pas été enregistré. Réessaie dans un instant." : MESSAGE_HORS_LIGNE };
  }
}
