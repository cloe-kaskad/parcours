import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { exigerEquipe } from "@/lib/auth";

export const metadata = { title: "Diagnostic" };

function Carte({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="papier mx-3.5 flex flex-col gap-3 p-5">
      <h2 className="font-titre text-[20px] font-semibold text-violet">{titre}</h2>
      {children}
    </section>
  );
}

function decrire(nom: string) {
  const v = process.env[nom];
  if (v === undefined) return { nom, etat: "absente", detail: "" };
  const brut = v;
  const net = v.trim();
  const detail = `${net.length} caractères, commence par « ${net.slice(0, 14)}… »${brut !== net ? ", contient des espaces ou retours à la ligne en bordure" : ""}${/\s/.test(net) ? ", contient des espaces à l'intérieur" : ""}`;
  return { nom, etat: net ? "présente" : "vide", detail };
}

async function testerAdmin() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const cle = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim().replace(/^["']|["']$/g, "");
  if (!url || !cle) return "Impossible : URL ou clé absente.";
  try {
    const client = createSupabaseClient(url, cle, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) return `Refusé par Supabase : ${error.message} (statut ${error.status ?? "?"})`;
    return `OK : l'accès admin fonctionne (${data.users.length} utilisateur lu).`;
  } catch (e) {
    return `Exception : ${e instanceof Error ? e.message : String(e)}`;
  }
}

export default async function Diagnostic() {
  await exigerEquipe();
  const vars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "RESEND_API_KEY",
  ].map(decrire);
  const admin = await testerAdmin();

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <h1 className="text-4xl font-bold md:text-5xl">Diagnostic</h1>
        <p className="mt-2 text-base text-gris">Ce que le serveur voit. Rien de secret n’est affiché en entier.</p>
      </section>
      <Carte titre="Variables d’environnement">
        <ul className="divide-y divide-ligne text-sm">
          {vars.map((v) => (
            <li key={v.nom} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
              <code className="w-72 shrink-0 font-mono text-violet">{v.nom}</code>
              <span className={v.etat === "présente" ? "text-emerald-700" : "text-rouge"}>{v.etat}</span>
              <span className="text-gris">{v.detail}</span>
            </li>
          ))}
        </ul>
      </Carte>
      <Carte titre="Accès admin Supabase">
        <p className="text-base">{admin}</p>
      </Carte>
    </div>
  );
}
