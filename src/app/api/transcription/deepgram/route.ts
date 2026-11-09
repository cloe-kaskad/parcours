import { after, NextResponse, type NextRequest } from "next/server";
import { finaliserTranscription, jetonValide, recevoirResultat, type RetourDeepgram } from "@/lib/transcription";
import { createServiceClient } from "@/lib/supabase/service";

export const maxDuration = 300;

// Deepgram rend ici le résultat d'une transcription. L'adresse porte un jeton propre à chaque demande.
export async function POST(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("t") ?? "";
  const jeton = request.nextUrl.searchParams.get("j") ?? "";
  if (!id || !jetonValide(id, jeton)) return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });

  const service = createServiceClient();
  const { data: ligne } = await service.from("transcriptions").select("seance_id, statut").eq("id", id).maybeSingle();
  if (!ligne) return NextResponse.json({ erreur: "inconnue" }, { status: 404 });
  // Deepgram peut renvoyer plusieurs fois, et un dépôt plus récent a pu remplacer celui-ci.
  if (ligne.statut === "terminee" || ligne.statut === "erreur") return NextResponse.json({ ok: true });

  const corps = (await request.json().catch(() => ({}))) as RetourDeepgram;
  const { data: prise } = await service.from("transcriptions").update({ statut: "en_cours", erreur: "traitement du résultat" }).eq("id", id).is("erreur", null).select("id");
  if (!prise?.length) return NextResponse.json({ ok: true });
  const tours = await recevoirResultat(id, ligne.seance_id, corps);
  if (tours) after(() => finaliserTranscription(id, ligne.seance_id, tours));
  return NextResponse.json({ ok: true });
}
