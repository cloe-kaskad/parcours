"use server";

import { revalidatePath } from "next/cache";
import { exigerEquipe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Resultat } from "./clientes";

export type SourceEpingle = "transcript" | "carnet" | "retour" | "lettre";

// Épingler une phrase pour la prochaine séance (équipe seulement, migration 0007).
export async function epingler(parcoursId: string, seanceId: string | null, source: SourceEpingle, texte: string): Promise<Resultat> {
  await exigerEquipe();
  const t = texte.replace(/\s+/g, " ").trim().slice(0, 2000);
  if (t.length < 3) return { ok: false, message: "Sélectionne une phrase." };
  const supabase = await createClient();
  const { error } = await supabase.from("epingles").insert({ parcours_id: parcoursId, seance_id: seanceId, source, texte: t });
  if (error) return { ok: false, message: error.message.includes("epingles") ? "L’épinglage arrive avec la migration 0007, pas encore appliquée." : "Pas épinglé. Réessaie dans un instant." };
  revalidatePath("/coach", "layout");
  return { ok: true, message: "Épinglé pour la prochaine séance." };
}

export async function retirerEpingle(fd: FormData) {
  await exigerEquipe();
  const supabase = await createClient();
  await supabase.from("epingles").delete().eq("id", String(fd.get("id") ?? ""));
  revalidatePath("/coach", "layout");
}
