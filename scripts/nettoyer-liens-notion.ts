/*
 * Retire des pratiques les restes de Notion qui ne mènent nulle part (docs/09, section 4) :
 * lignes qui ne sont qu'un lien vers une page exportée (« [Octobre](Pratiques%20-%20Vanessa/….md) »)
 * ou vers notion.so / app.notion.com, le titre « Pratiques précédentes », et un intertitre vide
 * laissé en fin de texte. Rien d'autre n'est modifié.
 *
 * Usage : npx tsx scripts/nettoyer-liens-notion.ts            (lecture à blanc : montre ce qui serait retiré)
 *         npx tsx scripts/nettoyer-liens-notion.ts --appliquer (écrit)
 * Les secrets sont lus dans .env.local (vercel env pull .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const APPLIQUER = process.argv.includes("--appliquer");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Une ligne qui n'est qu'un lien mort : page exportée (.md, chemin relatif encodé) ou page Notion.
const LIEN_MORT = /^\s*\[[^\]]*\]\((?:[^)\s]*%20[^)\s]*\.md|[^)\s:]*\.md|https?:\/\/(?:www\.)?(?:notion\.so|app\.notion\.com|[\w-]+\.notion\.site)[^)\s]*)\)\s*$/i;
const TITRE_NOTION = /^\s*#{1,6}\s*Pratiques? précédentes\s*$/i;
const TITRE_VIDE = /^\s*#{1,6}\s*$/;

export function nettoyer(texte: string): { texte: string; retire: string[] } {
  const lignes = texte.replace(/\r\n?/g, "\n").split("\n");
  const retire: string[] = [];
  const gardees = lignes.filter((l) => {
    if (LIEN_MORT.test(l) || TITRE_NOTION.test(l)) {
      retire.push(l);
      return false;
    }
    return true;
  });
  // Un intertitre vide en toute fin de texte (reste d'un bloc Notion coupé).
  while (gardees.length) {
    const derniere = gardees[gardees.length - 1];
    if (!derniere.trim()) gardees.pop();
    else if (TITRE_VIDE.test(derniere)) retire.push(gardees.pop()!);
    else break;
  }
  if (!retire.length) return { texte, retire };
  // Seules les lignes vides laissées par les retraits sont resserrées.
  return { texte: gardees.join("\n").replace(/\n{3,}/g, "\n\n"), retire };
}

type Cible = { table: "pratiques_series" | "pratiques"; id: string; nom: string; champs: Record<string, string> };

async function main() {
  const { data: series, error: e1 } = await supabase.from("pratiques_series").select("id, titre, intro, contenu, parcours(profiles(prenom))");
  const { data: exercices, error: e2 } = await supabase.from("pratiques").select("id, titre, accroche, consigne, regles, pourquoi, bonus, serie_id");
  if (e1 || e2) throw new Error((e1 ?? e2)!.message);
  const prenom = (s: (typeof series)[number]) => (s.parcours as unknown as { profiles: { prenom: string } } | null)?.profiles?.prenom ?? "?";
  const nomSerie = new Map(series.map((s) => [s.id, `${prenom(s)} · ${s.titre}`]));

  const cibles: Cible[] = [
    ...series.map((s) => ({ table: "pratiques_series" as const, id: s.id, nom: `${prenom(s)} · ${s.titre}`, champs: { intro: s.intro ?? "", contenu: s.contenu ?? "" } })),
    ...exercices.map((x) => ({
      table: "pratiques" as const,
      id: x.id,
      nom: `${nomSerie.get(x.serie_id) ?? "?"} · exercice « ${x.titre} »`,
      // Seuls les champs texte (les règles peuvent être une liste) : on ne touche pas au reste.
      champs: Object.fromEntries(Object.entries({ accroche: x.accroche, consigne: x.consigne, regles: x.regles, pourquoi: x.pourquoi, bonus: x.bonus }).filter((e): e is [string, string] => typeof e[1] === "string")),
    })),
  ];

  let touches = 0;
  for (const c of cibles) {
    const maj: Record<string, string> = {};
    for (const [champ, valeur] of Object.entries(c.champs)) {
      const r = nettoyer(valeur);
      if (!r.retire.length) continue;
      maj[champ] = r.texte;
      console.log(`\n${c.nom} (${champ}) : ${r.retire.length} ligne${r.retire.length > 1 ? "s" : ""} retirée${r.retire.length > 1 ? "s" : ""}`);
      for (const l of r.retire) console.log(`   - ${l}`);
    }
    if (!Object.keys(maj).length) continue;
    touches++;
    if (APPLIQUER) {
      const { error } = await supabase.from(c.table).update(maj).eq("id", c.id);
      console.log(error ? `   ÉCHEC : ${error.message}` : "   écrit");
    }
  }
  console.log(`\n${touches} élément${touches > 1 ? "s" : ""} concerné${touches > 1 ? "s" : ""}. ${APPLIQUER ? "Appliqué." : "Lecture à blanc : rien n'est écrit (--appliquer pour écrire)."}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
