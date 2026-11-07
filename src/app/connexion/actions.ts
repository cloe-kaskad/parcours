"use server";

import { createClient } from "@/lib/supabase/server";

export type EtatConnexion = { statut: "idle" } | { statut: "envoye"; email: string } | { statut: "erreur"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function envoyerLien(_prev: EtatConnexion, formData: FormData): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const suite = String(formData.get("suite") ?? "");
  if (!EMAIL_RE.test(email)) {
    return { statut: "erreur", message: "Cette adresse ne ressemble pas à un email." };
  }

  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirect = new URL("/auth/callback", base);
  if (suite.startsWith("/")) redirect.searchParams.set("suite", suite);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirect.toString(),
      // Seules les adresses déjà invitées par Cloé peuvent se connecter.
      shouldCreateUser: false,
    },
  });

  if (error) {
    if (/signups not allowed|not found|user not found/i.test(error.message)) {
      return {
        statut: "erreur",
        message: "Cette adresse n'a pas encore d'accès. Écris à Cloé si tu penses que c'est une erreur.",
      };
    }
    if (/rate limit|too many/i.test(error.message)) {
      return { statut: "erreur", message: "Un lien vient d'être envoyé. Regarde ta boîte mail avant d'en redemander un." };
    }
    return { statut: "erreur", message: "L'envoi n'a pas fonctionné. Réessaie dans un instant." };
  }

  return { statut: "envoye", email };
}
