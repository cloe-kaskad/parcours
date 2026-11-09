/*
 * Va chercher l'image des ressources de la bibliothèque qui ont un lien et pas encore d'image.
 * Usage : npx tsx scripts/recuperer-vignettes.ts [--ecrire]
 * Sans --ecrire, affiche seulement ce qui serait fait. Les secrets sont lus dans .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import { lireLien } from "../src/lib/lien";

process.loadEnvFile(".env.local");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(), { auth: { autoRefreshToken: false, persistSession: false } });
const ecrire = process.argv.includes("--ecrire");

(async () => {
  const { data } = await supabase.from("ressources").select("id, titre, url").is("image_url", null).not("url", "is", null);
  for (const r of data ?? []) {
    const infos = await lireLien(r.url!);
    console.log(`${r.titre.slice(0, 40)} : ${infos?.image ? "image trouvée" : "pas d'image"}`);
    if (ecrire && infos?.image) await supabase.from("ressources").update({ image_url: infos.image }).eq("id", r.id);
  }
  console.log(ecrire ? "Terminé." : "Lecture à blanc : rien n'a été écrit.");
})();
