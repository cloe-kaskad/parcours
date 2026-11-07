import { redirect } from "next/navigation";
import { CoquilleCoach } from "@/components/Coquille";
import { getProfil } from "@/lib/supabase/server";

export default async function LayoutCoach({ children }: { children: React.ReactNode }) {
  const profil = await getProfil();
  if (!profil) redirect("/connexion");
  if (profil.role === "cliente") redirect("/espace");
  return <CoquilleCoach profil={profil}>{children}</CoquilleCoach>;
}
