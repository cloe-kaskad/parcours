"use server";

import { revalidatePath } from "next/cache";
import { exigerEquipe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Resultat } from "./clientes";

// Cloé et Émilien, par séance : un message court, ou une remarque sous un exercice (pratiqueId).
// Équipe seulement, jamais lisible par la cliente (migration 0007).
export async function ecrireEchange(seanceId: string, pratiqueId: string | null, texte: string): Promise<Resultat> {
  await exigerEquipe();
  const t = texte.trim();
  if (!t) return { ok: false, message: "Le message est vide." };
  const supabase = await createClient();
  const { error } = await supabase.from("echanges").insert({ seance_id: seanceId, pratique_id: pratiqueId, texte: t.slice(0, 4000) });
  if (error) return { ok: false, message: error.message.includes("echanges") ? "Les échanges arrivent avec la migration 0007, pas encore appliquée." : "Pas envoyé. Réessaie dans un instant." };
  revalidatePath("/coach", "layout");
  revalidatePath("/emilien", "layout");
  return { ok: true };
}
