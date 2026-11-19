"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { accueilPourRole, createClient, getProfil } from "@/lib/supabase/server";

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

// Le même message neutre partout pour une adresse inconnue (docs/09, section 5).
const INCONNU = "Ce compte n’existe pas encore. Écris à Cloé.";
const MOT_DE_PASSE_MIN = 12;

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
        message: INCONNU,
      };
    }
    if (/rate limit|too many/i.test(error.message)) {
      return { statut: "erreur", message: "Un lien vient d'être envoyé. Regarde ta boîte mail avant d'en redemander un." };
    }
    return { statut: "erreur", message: `L'envoi n'a pas fonctionné (${error.message}).` };
  }

  return { statut: "envoye", email };
}

// Email et mot de passe. Supabase ne dit pas si l'adresse existe : un seul message, neutre.
export async function connexionMotDePasse(_prev: EtatConnexion, formData: FormData): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const suite = String(formData.get("suite") ?? "");
  if (!EMAIL_RE.test(email) || !motDePasse) return { statut: "erreur", message: "Écris ton adresse et ton mot de passe." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
  if (error) {
    if (/rate limit|too many/i.test(error.message)) return { statut: "erreur", message: "Trop d’essais d’un coup. Attends une minute avant de réessayer." };
    return { statut: "erreur", message: "Adresse ou mot de passe incorrect. Pas encore de mot de passe ? Crée-le plus bas." };
  }
  const profil = await getProfil();
  redirect(suite.startsWith("/") && !suite.startsWith("//") ? suite : profil ? accueilPourRole(profil.role) : "/");
}

// « Créer ou retrouver mon mot de passe » : un lien par email, qui ouvre la page où le choisir.
// Une adresse inconnue reçoit le même message : on ne dit pas qui a un compte.
export async function lienMotDePasse(_prev: EtatConnexion, formData: FormData): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { statut: "erreur", message: "Cette adresse ne ressemble pas à un email." };
  const supabase = await createClient();
  const retour = new URL("/auth/callback", await adresseDuSite());
  retour.searchParams.set("suite", "/mot-de-passe");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: retour.toString() });
  if (error && /rate limit|too many/i.test(error.message)) return { statut: "erreur", message: "Un lien vient d'être envoyé. Regarde ta boîte mail avant d'en redemander un." };
  if (error) console.error("resetPasswordForEmail", error.message);
  return { statut: "envoye", email };
}

export type EtatMotDePasse = { statut: "idle" } | { statut: "erreur"; message: string };

// Choisir son mot de passe, une fois connectée (lien reçu par email, ou « Mon compte »).
export async function choisirMotDePasse(_prev: EtatMotDePasse, formData: FormData): Promise<EtatMotDePasse> {
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (motDePasse.length < MOT_DE_PASSE_MIN) return { statut: "erreur", message: `Douze caractères au moins.` };
  if (motDePasse !== confirmation) return { statut: "erreur", message: "Les deux mots de passe ne sont pas les mêmes." };
  const supabase = await createClient();
  const profil = await getProfil();
  if (!profil) return { statut: "erreur", message: "Le lien n’est plus valable. Demande-en un nouveau depuis la page de connexion." };
  const { error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) {
    if (/same|different/i.test(error.message)) return { statut: "erreur", message: "C’est déjà ton mot de passe actuel." };
    if (/weak|short|length/i.test(error.message)) return { statut: "erreur", message: "Ce mot de passe est trop simple. Allonge-le un peu." };
    return { statut: "erreur", message: "Ça n’a pas été enregistré. Réessaie dans un instant." };
  }
  redirect("/compte?mot_de_passe=ok");
}
