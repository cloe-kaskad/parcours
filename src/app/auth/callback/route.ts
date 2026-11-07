import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { accueilPourRole, createClient, getProfil } from "@/lib/supabase/server";

// Point d'arrivée du lien magique. Gère les deux formats Supabase :
// ?code=… (flux PKCE) et ?token_hash=…&type=magiclink (modèle d'email personnalisé).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const suite = searchParams.get("suite");

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  if (!ok) {
    return NextResponse.redirect(new URL("/connexion?erreur=lien", origin));
  }

  if (suite && suite.startsWith("/") && !suite.startsWith("//")) {
    return NextResponse.redirect(new URL(suite, origin));
  }

  const profil = await getProfil();
  return NextResponse.redirect(new URL(profil ? accueilPourRole(profil.role) : "/connexion", origin));
}
