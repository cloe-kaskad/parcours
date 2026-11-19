// Jetable : enregistre en base les versions lisibles validées par Cloé (apercus/), après contrôle « mêmes mots ».
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { memesMots } from "../src/lib/retour.ts";
process.loadEnvFile(".env.local");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(), { auth: { persistSession: false } });
for (const f of readdirSync("apercus").filter((x) => x.startsWith(".id-"))) {
  const nom = f.slice(4), id = readFileSync(`apercus/${f}`, "utf8").trim();
  const lisible = readFileSync(`apercus/retour-lisible-${nom}.md`, "utf8");
  const { data: r } = await sb.from("retours").select("contenu").eq("id", id).single();
  const c = memesMots(r!.contenu, lisible);
  if (!c.ok) { console.log(nom, "REFUSÉ", c.ecart); continue; }
  const { error } = await sb.from("retours").update({ contenu_lisible: lisible, contenu_lisible_at: new Date().toISOString() }).eq("id", id);
  console.log(nom, error ? `échec : ${error.message}` : "enregistré");
}
