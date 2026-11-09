import type { Viewport } from "next";
import { redirect } from "next/navigation";
import { getProfil } from "@/lib/supabase/server";

export const viewport: Viewport = { themeColor: "#59114D" };

export default async function LayoutCliente({ children }: { children: React.ReactNode }) {
  const profil = await getProfil();
  if (!profil) redirect("/connexion");
  if (profil.role !== "cliente") redirect("/coach");
  return <main className="flex min-h-full flex-1 flex-col bg-violet text-creme">{children}</main>;
}
