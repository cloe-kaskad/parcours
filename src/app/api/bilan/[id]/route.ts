import { chargerBilan } from "@/lib/bilan";
import { creerPdfBilan } from "@/lib/bilan-pdf";
import { getProfil } from "@/lib/supabase/server";

// Le PDF du bilan, pour Cloé seule. Rien n'est envoyé à la cliente.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const profil = await getProfil();
  if (profil?.role !== "coach") return new Response("Réservé à Cloé.", { status: 403 });
  const { id } = await params;
  const bilan = await chargerBilan(id);
  if (!bilan) return new Response("Introuvable.", { status: 404 });
  const pdf = await creerPdfBilan(bilan);
  const nom = bilan.prenom.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9-]/g, "");
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="bilan-${nom}.pdf"` } });
}
