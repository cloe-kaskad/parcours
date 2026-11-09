"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerEquipe, texte } from "@/lib/auth";
import { identifiantDrive } from "@/lib/couvertures";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type Resultat = { ok: true; message?: string } | { ok: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function rafraichir() {
  revalidatePath("/coach", "layout");
  revalidatePath("/espace", "layout");
}

// Crée le compte, le profil (via le trigger) et le parcours. Aucun email ne part : le lien d'accès est un geste séparé.
export async function creerCliente(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const email = texte(fd, "email").toLowerCase();
  const prenom = texte(fd, "prenom");
  const nom = texte(fd, "nom");
  if (!prenom) return { ok: false, message: "Le prénom manque." };
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Cette adresse ne ressemble pas à un email." };

  const service = createServiceClient();
  const { data: cree, error } = await service.auth.admin.createUser({ email, email_confirm: true, user_metadata: { role: "cliente", prenom, nom } });
  if (error) {
    if (/already|exists|registered/i.test(error.message)) return { ok: false, message: "Un compte existe déjà avec cette adresse." };
    return { ok: false, message: "Son espace n’a pas pu être créé. Réessaie dans un instant." };
  }
  const clienteId = cree.user.id;
  await service.from("profiles").update({ prenom, nom, role: "cliente" }).eq("id", clienteId);
  const { data: programme } = await service.from("programmes").select("id").eq("slug", "bi").single();
  const drive = texte(fd, "drive");
  const { error: errParcours } = await service.from("parcours").insert({
    cliente_id: clienteId,
    programme_id: programme!.id,
    intention: texte(fd, "intention"),
    couverture_path: texte(fd, "couverture") || null,
    drive_folder_id: identifiantDrive(drive),
    drive_folder_nom: drive ? texte(fd, "drive_nom") || null : null,
  });
  if (errParcours) return { ok: false, message: "Le compte existe, mais son parcours n’a pas pu être créé." };
  rafraichir();
  redirect(`/coach/clientes/${clienteId}`);
}

export async function modifierFiche(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ prenom: texte(fd, "prenom"), nom: texte(fd, "nom"), actif: fd.get("actif") === "on" }).eq("id", texte(fd, "id"));
  if (error) return { ok: false, message: "Ça n’a pas été enregistré." };
  rafraichir();
  return { ok: true, message: "Enregistré." };
}

export async function modifierIntention(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const supabase = await createClient();
  const { error } = await supabase.from("parcours").update({ intention: texte(fd, "intention") }).eq("id", texte(fd, "parcours_id"));
  if (error) return { ok: false, message: "Ça n’a pas été enregistré." };
  rafraichir();
  return { ok: true, message: "Enregistré." };
}

export async function choisirCouverture(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const chemin = texte(fd, "couverture");
  if (!chemin) return { ok: false, message: "Choisis une image." };
  const supabase = await createClient();
  const { error } = await supabase.from("parcours").update({ couverture_path: chemin }).eq("id", texte(fd, "parcours_id"));
  if (error) return { ok: false, message: "Ça n’a pas été enregistré." };
  rafraichir();
  return { ok: true, message: "Couverture changée." };
}

export async function couvertureDeposee(parcoursId: string, chemin: string): Promise<Resultat> {
  await exigerEquipe();
  const supabase = await createClient();
  const { error } = await supabase.from("parcours").update({ couverture_path: chemin }).eq("id", parcoursId);
  if (error) return { ok: false, message: "Ça n’a pas été enregistré." };
  rafraichir();
  return { ok: true, message: "Couverture changée." };
}

export async function relierDrive(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const saisie = texte(fd, "drive");
  const supabase = await createClient();
  const { error } = await supabase
    .from("parcours")
    .update({ drive_folder_id: identifiantDrive(saisie), drive_folder_nom: saisie ? texte(fd, "drive_nom") || null : null })
    .eq("id", texte(fd, "parcours_id"));
  if (error) return { ok: false, message: "Ça n’a pas été enregistré." };
  rafraichir();
  return { ok: true, message: "Dossier relié." };
}

export async function noteEmilienDeposee(clienteId: string, chemin: string, _duree: number | null, titre: string): Promise<Resultat> {
  await exigerEquipe();
  const supabase = await createClient();
  const { error } = await supabase.from("notes_emilien").insert({ cliente_id: clienteId, titre: titre.trim() || "Une note d’Émilien", fichier_path: chemin });
  if (error) return { ok: false, message: "Ça n’a pas été enregistré." };
  rafraichir();
  return { ok: true, message: "Note déposée." };
}

// Envoie le lien de connexion à la cliente : le seul geste de cette page qui part par email.
export async function envoyerLienAcces(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const email = texte(fd, "email").toLowerCase();
  const service = createServiceClient();
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://parcours.amarecherche.fr";
  const { error } = await service.auth.signInWithOtp({ email, options: { emailRedirectTo: `${base}/auth/callback`, shouldCreateUser: false } });
  if (error) return { ok: false, message: `L’envoi n’a pas fonctionné : ${error.message}` };
  return { ok: true, message: `Lien envoyé à ${email}.` };
}
