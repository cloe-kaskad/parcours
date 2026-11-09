import "server-only";
import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";

const EXPEDITEUR = "Blocages & Intuition <parcours@amarecherche.fr>";

// Envoie un email une seule fois : la ligne du journal est posée avant l'envoi,
// et retirée si l'envoi échoue, pour pouvoir réessayer. Réservé à Cloé et Émilien pour l'instant.
export async function envoyerUneFois({ type, destinataire, seanceId, sujet, corps }: { type: string; destinataire: string; seanceId: string | null; sujet: string; corps: ReactElement }) {
  const cle = process.env.RESEND_API_KEY?.trim();
  if (!cle) {
    console.warn("Email non envoyé : RESEND_API_KEY absente.");
    return false;
  }
  const service = createServiceClient();
  const { data: ligne, error } = await service.from("emails_envoyes").insert({ type, destinataire, seance_id: seanceId }).select("id").single();
  if (error) return false; // déjà envoyé
  const { error: echec } = await new Resend(cle).emails.send({ from: EXPEDITEUR, to: destinataire, subject: sujet, html: await render(corps) });
  if (echec) {
    console.error("Envoi de l'email", echec.message);
    await service.from("emails_envoyes").delete().eq("id", ligne.id);
    return false;
  }
  return true;
}
