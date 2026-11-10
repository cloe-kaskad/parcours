"use server";

import { revalidatePath } from "next/cache";
import { exigerEquipe, texte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Resultat } from "./clientes";

// La note de parcours : Cloé et Émilien l'écrivent, la cliente ne la voit jamais
// (table parcours_notes_equipe, réservée à l'équipe par la Row Level Security).
// L'auteur et la date sont posés par la base.
export async function enregistrerNoteEquipe(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const parcoursId = texte(fd, "parcours_id");
  const supabase = await createClient();
  const { error } = await supabase.from("parcours_notes_equipe").upsert({ parcours_id: parcoursId, note_equipe: texte(fd, "note") }, { onConflict: "parcours_id" });
  if (error) return { ok: false, message: "Ça n’a pas été enregistré. Réessaie dans un instant." };
  revalidatePath("/coach/clientes", "layout");
  return { ok: true, message: "Enregistré." };
}
