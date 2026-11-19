// Jetable : npx tsx scripts/.verif-lisible.mts deborah-3 [vanessa-4 …] → contrôle « mêmes mots, même ordre ».
import { readFileSync } from "node:fs";
import { memesMots } from "../src/lib/retour.ts";
for (const n of process.argv.slice(2)) {
  const c = memesMots(readFileSync(`apercus/retour-origine-${n}.txt`, "utf8"), readFileSync(`apercus/retour-lisible-${n}.md`, "utf8"));
  console.log(n, c.ok ? "OK" : `REFUSÉ : ${c.ecart}`);
}
