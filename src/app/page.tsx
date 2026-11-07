import { redirect } from "next/navigation";
import { accueilPourRole, getProfil } from "@/lib/supabase/server";

export default async function Accueil() {
  const profil = await getProfil();
  redirect(profil ? accueilPourRole(profil.role) : "/connexion");
}
