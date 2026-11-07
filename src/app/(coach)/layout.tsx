import { redirect } from "next/navigation";
import { Coquille } from "@/components/Coquille";
import { getProfil } from "@/lib/supabase/server";

const LIENS = [
  { href: "/coach", label: "Tableau de bord" },
  { href: "/coach/clientes", label: "Clientes" },
  { href: "/coach/ressources", label: "Ressources" },
];

export default async function LayoutCoach({ children }: { children: React.ReactNode }) {
  const profil = await getProfil();
  if (!profil) redirect("/connexion");
  if (profil.role === "cliente") redirect("/espace");
  return (
    <Coquille profil={profil} liens={LIENS} accueil="/coach">
      {children}
    </Coquille>
  );
}
