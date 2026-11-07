"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Adresse publique du site : la variable NEXT_PUBLIC_APP_URL si elle est valide, sinon l'hôte de la requête.
async function adresseDuSite(): Promise<string> {
  const brut = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/^["']|["']$/g, "");
  try {
    if (brut) return new URL(brut.startsWith("http") ? brut : `https://${brut}`).origin;
  } catch {
    // on retombe sur l'hôte de la requête
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export type EtatConnexion = { statut: "idle" } | { statut: "envoye"; email: string } | { statut: "erreur"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function envoyerLien(_prev: EtatConnexion, formData: FormData): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const suite = String(formData.get("suite") ?? "");
  if (!EMAIL_RE.test(email)) {
    return { statut: "erreur", message: "Cette adresse ne ressemble pas à un email." };
  }

  let error: { message: string } | null = null;
  try {
    const supabase = await createClient();
    const redirect = new URL("/auth/callback", await adresseDuSite());
    if (suite.startsWith("/")) redirect.searchParams.set("suite", suite);

    const res = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirect.toString(),
        // Seules les adresses déjà invitées par Cloé peuvent se connecter.
        shouldCreateUser: false,
      },
    });
    error = res.error;
  } catch (e) {
    console.error("envoyerLien", e);
    const message = e instanceof Error ? e.message : String(e);
    return { statut: "erreur", message: `Problème technique : ${message}` };
  }

  if (error) {
    console.error("signInWithOtp", error.message);
    if (/signups not allowed|not found|user not found/i.test(error.message)) {
      return {
        statut: "erreur",
        message: "Cette adresse n'a pas encore d'accès. Écris à Cloé si tu penses que c'est une erreur.",
      };
    }
    if (/rate limit|too many/i.test(error.message)) {
      return { statut: "erreur", message: "Un lien vient d'être envoyé. Regarde ta boîte mail avant d'en redemander un." };
    }
    return { statut: "erreur", message: `L'envoi n'a pas fonctionné (${error.message}).` };
  }

  return { statut: "envoye", email };
}
