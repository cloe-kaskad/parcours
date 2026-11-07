"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerEquipe, texte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type Resultat = { ok: true; message?: string } | { ok: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Crée le compte de la cliente, son profil (via le trigger) et son parcours.
export async function creerCliente(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const email = texte(fd, "email").toLowerCase();
  const prenom = texte(fd, "prenom");
  const nom = texte(fd, "nom");
  const intention = texte(fd, "intention");
  const dateDebut = texte(fd, "date_debut") || null;

  if (!EMAIL_RE.test(email)) return { ok: false, message: "L'adresse email n'est pas valide." };
  if (!prenom) return { ok: false, message: "Le prénom est obligatoire." };

  const service = createServiceClient();
  const { data: cree, error } = await service.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { role: "cliente", prenom, nom },
  });
  if (error) {
    if (/already|exists|registered/i.test(error.message)) {
      return { ok: false, message: "Un compte existe déjà avec cette adresse." };
    }
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  const clienteId = cree.user.id;
  // Le trigger a créé le profil ; on s'assure des champs au cas où.
  await service.from("profiles").update({ prenom, nom, role: "cliente" }).eq("id", clienteId);

  const { data: programme } = await service.from("programmes").select("id").eq("slug", "bi").single();
  const { error: errParcours } = await service.from("parcours").insert({
    cliente_id: clienteId,
    programme_id: programme!.id,
    intention,
    date_debut: dateDebut,
  });
  if (errParcours) return { ok: false, message: `Compte créé mais parcours non créé : ${errParcours.message}` };

  revalidatePath("/coach");
  redirect(`/coach/clientes/${clienteId}`);
}

export async function mettreAJourCliente(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const id = texte(fd, "id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ prenom: texte(fd, "prenom"), nom: texte(fd, "nom"), actif: fd.get("actif") === "on" })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/coach/clientes/${id}`);
  revalidatePath("/coach");
  return { ok: true, message: "Enregistré." };
}

export async function mettreAJourParcours(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const id = texte(fd, "id");
  const clienteId = texte(fd, "cliente_id");
  const motsCles = texte(fd, "mots_cles")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const supabase = await createClient();
  const { error } = await supabase
    .from("parcours")
    .update({
      intention: texte(fd, "intention"),
      mots_cles: motsCles,
      date_debut: texte(fd, "date_debut") || null,
      statut: texte(fd, "statut") || "actif",
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/coach/clientes/${clienteId}`);
  return { ok: true, message: "Enregistré." };
}

// Envoie (ou renvoie) le lien de connexion à la cliente.
export async function envoyerLienAcces(_prev: Resultat | null, fd: FormData): Promise<Resultat> {
  await exigerEquipe();
  const email = texte(fd, "email").toLowerCase();
  const service = createServiceClient();
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://parcours.amarecherche.fr";
  const { error } = await service.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${base}/auth/callback`, shouldCreateUser: false },
  });
  if (error) return { ok: false, message: `Envoi impossible : ${error.message}` };
  return { ok: true, message: `Lien envoyé à ${email}.` };
}
