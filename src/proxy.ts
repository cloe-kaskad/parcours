import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rafraîchit la session Supabase à chaque requête et protège les espaces privés.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims vérifie le jeton sur place (clé publique de Supabase), sans aller-retour réseau ;
  // il rafraîchit aussi la session quand elle expire. Avec une clé ancienne, il revient à getUser.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims?.sub ? { id: data.claims.sub } : null;

  const { pathname } = request.nextUrl;
  const prive = pathname.startsWith("/espace") || pathname.startsWith("/coach") || pathname.startsWith("/emilien") || pathname.startsWith("/compte") || pathname.startsWith("/mot-de-passe");

  if (!user && prive) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("suite", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/connexion") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Session longue, y compris dans l'application installée sur iPhone : à chaque ouverture de page,
  // les cookies de session repartent du serveur pour 400 jours. Un cookie écrit par le navigateur
  // (rafraîchissement en arrière-plan) peut être raccourci par Safari ; reposé ici, il ne l'est pas.
  if (user && request.method === "GET" && request.headers.get("sec-fetch-dest") !== "empty") {
    const dejaPoses = new Set(response.cookies.getAll().map((c) => c.name));
    for (const c of request.cookies.getAll()) {
      if (!c.name.startsWith("sb-") || dejaPoses.has(c.name)) continue;
      response.cookies.set(c.name, c.value, { path: "/", maxAge: 400 * 24 * 60 * 60, sameSite: "lax", secure: request.nextUrl.protocol === "https:", httpOnly: false });
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|svg|webp|woff2?)$).*)"],
};
