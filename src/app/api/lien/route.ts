import { NextResponse, type NextRequest } from "next/server";
import { exigerEquipe } from "@/lib/auth";
import { lireLien } from "@/lib/lien";

// Lit les informations d'un lien collé dans la bibliothèque. Réservé à Cloé et Émilien.
export async function POST(request: NextRequest) {
  await exigerEquipe();
  const { url } = (await request.json().catch(() => ({}))) as { url?: string };
  if (!url) return NextResponse.json({ erreur: "Lien manquant." }, { status: 400 });
  const infos = await lireLien(url);
  if (!infos) return NextResponse.json({ erreur: "Ce lien ne ressemble pas à une page publique." }, { status: 400 });
  return NextResponse.json(infos);
}
