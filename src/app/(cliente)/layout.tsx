import { redirect } from "next/navigation";
import { Coquille } from "@/components/Coquille";
import { getProfil } from "@/lib/supabase/server";

const LIENS = [
  { href: "/espace", label: "Accueil" },
  { href: "/espace/chemin", label: "Mon chemin" },
  { href: "/espace/pratiques", label: "Pratiques" },
  { href: "/espace/seances", label: "Séances" },
  { href: "/espace/ressources", label: "Ressources" },
  { href: "/espace/journal", label: "Journal" },
  { href: "/espace/a-propos", label: "À propos" },
];

export default async function LayoutCliente({ children }: { children: React.ReactNode }) {
  const profil = await getProfil();
  if (!profil) redirect("/connexion");
  if (profil.role !== "cliente") redirect("/coach");
  return (
    <Coquille profil={profil} liens={LIENS} accueil="/espace">
      {children}
    </Coquille>
  );
}
