// Les notes prises en mode en séance, rangées dans `seances_preparations.notes_seance` (texte).
// Chaque note commence par une ligne d'en-tête : « [00:12:40 · Profil du moment] le texte ».
// Les lignes suivantes (Maj+Entrée) appartiennent à la même note. L'ancien format « [00:12:40] » reste lu.
export type NoteSeance = { heure: string; section: string; texte: string };

const EN_TETE = /^\[(\d{1,2}:\d{2}(?::\d{2})?)(?:\s*·\s*([^\]]*))?\]\s?(.*)$/;

export function lireNotes(brut: string): NoteSeance[] {
  const notes: NoteSeance[] = [];
  for (const ligne of brut.replace(/\r\n?/g, "\n").split("\n")) {
    const m = ligne.match(EN_TETE);
    if (m) notes.push({ heure: m[1], section: (m[2] ?? "").trim(), texte: m[3] });
    else if (notes.length) notes[notes.length - 1].texte += `\n${ligne}`;
    else if (ligne.trim()) notes.push({ heure: "", section: "", texte: ligne });
  }
  return notes.map((n) => ({ ...n, texte: n.texte.replace(/\n+$/, "") })).filter((n) => n.texte.trim());
}

export function ecrireNotes(notes: NoteSeance[]) {
  return notes
    .map((n) => {
      const texte = n.texte.replace(/\n{2,}/g, "\n").trim();
      return n.heure ? `[${n.heure}${n.section ? ` · ${n.section.replace(/\]/g, ")")}` : ""}] ${texte}` : texte;
    })
    .join("\n");
}

// « 00:12:40 » s'affiche « 00:12 » (heures et minutes de séance), comme sur la maquette.
export const heureCourte = (h: string) => (h.length === 8 ? h.slice(0, 5) : h);
