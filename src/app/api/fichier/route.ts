import { NextResponse, type NextRequest } from "next/server";
import { createClient, getProfil } from "@/lib/supabase/server";

// Un fichier privé (audio, PDF, vocal), signé seulement quand on l'ouvre.
// La signature se fait avec la session de la personne connectée : les règles de l'espace
// de stockage s'appliquent (Émilien n'ouvre pas les préparations de Cloé, une cliente rien de l'équipe).
const ESPACES = new Set(["audio", "transcripts", "retours", "notes", "preparations", "vocaux"]);

export async function GET(request: NextRequest) {
  const profil = await getProfil();
  if (!profil || profil.role === "cliente") return new NextResponse("Accès refusé.", { status: 403 });
  const b = request.nextUrl.searchParams.get("b") ?? "";
  const p = request.nextUrl.searchParams.get("p") ?? "";
  if (!ESPACES.has(b) || !p || p.includes("..")) return new NextResponse("Fichier inconnu.", { status: 404 });
  const supabase = await createClient();
  const { data } = await supabase.storage.from(b).createSignedUrl(p, 3600);
  if (!data?.signedUrl) return new NextResponse("Fichier introuvable.", { status: 404 });
  return NextResponse.redirect(data.signedUrl, 302);
}
