/*
 * Reconstitue le texte complet (pratiques_series.contenu) des lettres migrées depuis Notion,
 * à partir de leur introduction et de leurs exercices, et pose l'identifiant stable de chaque exercice.
 * Seules les lettres dont le contenu est vide sont traitées.
 *
 * Usage : npx tsx scripts/reconstituer-lettres.ts [--ecrire]
 * Sans --ecrire, affiche ce qui serait fait. Les secrets sont lus dans .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import { lireLettre } from "../src/lib/lettre";
import { titrePropre } from "../src/lib/textes";

process.loadEnvFile(".env.local");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(), {
  auth: { autoRefreshToken: false, persistSession: false },
});
const ecrire = process.argv.includes("--ecrire");

type Pratique = { id: string; ordre: number; titre: string; accroche: string; consigne: string; regles: string; pourquoi: string };

function composer(intro: string, exercices: Pratique[]) {
  const parties = intro.trim() ? [intro.trim()] : [];
  exercices.forEach((e, i) => {
    parties.push(`## ${titrePropre(e.titre) || `Exercice ${i + 1}`}`);
    if (e.accroche.trim()) parties.push(e.accroche.trim());
    // Un titre à l'intérieur d'une consigne ne doit pas devenir un exercice.
    if (e.consigne.trim()) parties.push(e.consigne.trim().replace(/^#{1,6}\s+/gm, "#### "));
    if (e.regles.trim()) parties.push(e.regles.trim());
    if (e.pourquoi.trim()) {
      parties.push(
        e.pourquoi
          .trim()
          .split("\n")
          .map((l) => `> ${l}`)
          .join("\n"),
      );
    }
  });
  return parties.join("\n\n");
}

(async () => {
  const { data: series, error } = await supabase.from("pratiques_series").select("id, titre, intro").eq("contenu", "");
  if (error) throw error;
  for (const serie of series ?? []) {
    const { data } = await supabase.from("pratiques").select("id, ordre, titre, accroche, consigne, regles, pourquoi").eq("serie_id", serie.id).order("ordre");
    const exercices = (data ?? []) as Pratique[];
    const contenu = composer(serie.intro, exercices);
    if (!contenu) {
      console.log(`${serie.titre} : vide, ignorée`);
      continue;
    }
    const { chapitres } = lireLettre(contenu);
    if (chapitres.length !== exercices.length) throw new Error(`${serie.titre} : ${chapitres.length} chapitres pour ${exercices.length} exercices`);
    console.log(`${serie.titre} : ${exercices.length} exercice(s), ${contenu.length} signes, ${chapitres.map((c) => c.slug).join(", ")}`);
    if (!ecrire) continue;
    const { error: e1 } = await supabase.from("pratiques_series").update({ contenu }).eq("id", serie.id);
    if (e1) throw e1;
    for (let i = 0; i < exercices.length; i++) {
      const { error: e2 } = await supabase.from("pratiques").update({ slug: chapitres[i].slug }).eq("id", exercices[i].id);
      if (e2) throw e2;
    }
  }
  console.log(ecrire ? "Terminé." : "Lecture à blanc : rien n'a été écrit.");
})();
