import { redirect } from "next/navigation";
import { CoquilleCliente } from "@/components/Coquille";
import { getProfil } from "@/lib/supabase/server";

export default async function LayoutCliente({ children }: { children: React.ReactNode }) {
  const profil = await getProfil();
  if (!profil) redirect("/connexion");
  if (profil.role !== "cliente") redirect("/coach");
  return <CoquilleCliente profil={profil}>{children}</CoquilleCliente>;
}
