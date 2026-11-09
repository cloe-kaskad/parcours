"use server";

import { revalidatePath } from "next/cache";
import { RetourEmilienEnvoye } from "@/emails/RetourEmilienEnvoye";
import { getProfil } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { envoyerUneFois } from "@/lib/emails";
import { lireLien } from "@/lib/lien";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Profile } from "@/lib/supabase/types";
import type { Resultat } from "./clientes";

type Saisie = { seanceId: string; contenu: string; url: string; mot: string };

async function exigerRelecteur(): Promise<Profile> {
  const profil = await getProfil();
  if (!profil) redirect("/connexion");
  if (profil.role !== "relecteur") redirect("/coach");
  return profil;
}

function rafraichir() {
  revalidatePath("/emilien", "layout");
  revalidatePath("/coach", "layout");
}

// Une seule ligne de retour par séance et par relecteur.
async function ecrire(profil: Profile, { seanceId, contenu, url, mot }: Saisie, envoye: boolean) {
  const supabase = await createClient();
  const { data: existant } = await supabase.from("retours").select("id, envoye_at").eq("seance_id", seanceId).eq("auteur_id", profil.id).maybeSingle();
  const valeurs = {
    contenu: contenu.trim(),
    ressource_proposee_url: url.trim() || null,
    ressource_proposee_mot: mot.trim() || null,
    envoye_at: existant?.envoye_at ?? (envoye ? new Date().toISOString() : null),
  };
  const { error } = existant ? await supabase.from("retours").update(valeurs).eq("id", existant.id) : await supabase.from("retours").insert({ seance_id: seanceId, auteur_id: profil.id, ...valeurs });
  return error ? null : { premierEnvoi: envoye && !existant?.envoye_at };
}

export async function enregistrerRetour(saisie: Saisie): Promise<Resultat> {
  const profil = await exigerRelecteur();
  const r = await ecrire(profil, saisie, false);
  if (!r) return { ok: false, message: "Ça n’a pas été enregistré. Réessaie dans un instant." };
  rafraichir();
  return { ok: true, message: "Enregistré." };
}

// La ressource proposée arrive dans la bibliothèque de Cloé, en attente.
async function proposerRessource(url: string, mot: string) {
  if (!url.trim()) return;
  const supabase = await createClient();
  const { data: deja } = await supabase.from("ressources").select("id").eq("url", url.trim()).maybeSingle();
  if (deja) return;
  const infos = await lireLien(url).catch(() => null);
  await supabase.from("ressources").insert({
    type: infos?.type ?? "autre",
    titre: infos?.titre ?? url.trim(),
    auteur: infos?.auteur ?? "",
    url: url.trim(),
    image_url: infos?.image ?? null,
    description: mot.trim() || infos?.description || "",
    source: "emilien",
    en_attente: true,
  });
}

export async function envoyerRetour(saisie: Saisie): Promise<Resultat> {
  const profil = await exigerRelecteur();
  if (!saisie.contenu.trim()) return { ok: false, message: "Ton retour est vide." };
  const r = await ecrire(profil, saisie, true);
  if (!r) return { ok: false, message: "Ton retour n’a pas été envoyé. Réessaie dans un instant." };
  await proposerRessource(saisie.url, saisie.mot);
  if (r.premierEnvoi) {
    const service = createServiceClient();
    const { data: seance } = await service.from("seances").select("numero, parcours(cliente_id, profiles(prenom))").eq("id", saisie.seanceId).single();
    const { data: coach } = await service.from("profiles").select("email").eq("role", "coach").limit(1).single();
    const parcours = seance?.parcours as unknown as { cliente_id: string; profiles: { prenom: string } } | null;
    if (seance && parcours && coach) {
      await envoyerUneFois({
        type: "retour_emilien",
        destinataire: coach.email,
        seanceId: saisie.seanceId,
        sujet: `${parcours.profiles.prenom}, séance ${seance.numero} : le retour d’Émilien est là`,
        corps: RetourEmilienEnvoye({ prenom: parcours.profiles.prenom, numero: seance.numero, clienteId: parcours.cliente_id, seanceId: saisie.seanceId }),
      });
    }
  }
  rafraichir();
  return { ok: true };
}
