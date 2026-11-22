import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const reponse = NextResponse.redirect(new URL("/connexion", request.nextUrl.origin), { status: 303 });
  // Les pages gardées pour la lecture hors connexion partent avec la session.
  reponse.headers.set("Clear-Site-Data", '"cache", "storage"');
  return reponse;
}
