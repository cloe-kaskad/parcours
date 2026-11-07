/*
 * Vérifie, en lecture seule, ce que la migration Notion a créé pour chaque cliente.
 * Usage : npx tsx scripts/verifier-migration.ts [--clientes scripts/clientes.json]
 * Les secrets sont lus dans .env.local (vercel env pull .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const args = process.argv.slice(2);
const i = args.indexOf("--clientes");
const CLIENTES_PATH = i >= 0 ? args[i + 1] : "scripts/clientes.json";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

type ClienteConfig = { prenom: string; email: string };

async function verifier(c: ClienteConfig) {
  const email = c.email.trim().toLowerCase();
  const { data: profil } = await supabase.from("profiles").select("id, prenom, role, actif").eq("email", email).maybeSingle();
  if (!profil) return console.log(`\n=== ${c.prenom} : AUCUN COMPTE`);
  const { data: parcours } = await supabase.from("parcours").select("id, intention").eq("cliente_id", profil.id);
  console.log(`\n=== ${c.prenom} · rôle ${profil.role} · ${parcours?.length ?? 0} parcours`);
  for (const p of parcours ?? []) {
    console.log(`Intention : ${p.intention ? p.intention.slice(0, 80) + "…" : "VIDE"}`);
    const { data: seances } = await supabase.from("seances").select("id, numero, date, transcript_pdf_path").eq("parcours_id", p.id).order("numero");
    console.log(`Séances : ${(seances ?? []).map((s) => `${s.numero}${s.transcript_pdf_path ? " (transcript)" : ""}${s.date ? "" : " [sans date]"}`).join(", ") || "aucune"}`);
    const { data: series } = await supabase.from("pratiques_series").select("id, titre, seance_id, publiee_at").eq("parcours_id", p.id).order("publiee_at");
    const numeroDe = new Map((seances ?? []).map((s) => [s.id, s.numero]));
    for (const s of series ?? []) {
      const { data: ex } = await supabase.from("pratiques").select("titre, consigne").eq("serie_id", s.id).order("ordre");
      const vides = (ex ?? []).filter((e) => !e.consigne?.trim()).length;
      console.log(`  - ${s.titre} [séance ${s.seance_id ? numeroDe.get(s.seance_id) : "aucune"}] : ${ex?.length ?? 0} exercice(s)${vides ? `, ${vides} sans consigne` : ""}`);
    }
    const { count: nbRessources } = await supabase.from("ressources_affectations").select("ressource_id", { count: "exact", head: true }).eq("parcours_id", p.id);
    console.log(`Ressources affectées : ${nbRessources ?? 0}`);
  }
  const { count: nbJournal } = await supabase.from("journal").select("id", { count: "exact", head: true }).eq("cliente_id", profil.id);
  const { count: nbFeedback } = await supabase.from("feedbacks").select("id", { count: "exact", head: true }).eq("cliente_id", profil.id);
  console.log(`Journal : ${nbJournal ?? 0} entrée(s) · Feedback : ${nbFeedback ?? 0}`);
}

const clientes = JSON.parse(readFileSync(CLIENTES_PATH, "utf8")) as ClienteConfig[];
(async () => {
  for (const c of clientes) await verifier(c);
})();
