/* eslint-disable @typescript-eslint/no-require-imports */
// Génère les icônes et les écrans de démarrage de l'application installable dans public/pwa.
// Source : le logo crème et rouge (design/pwa/logo-clair-rouge.svg) sur violet #59114D.
// Lancer : node design/pwa/generer-icones.cjs (demande playwright-core et Chromium).
const path = require("node:path");
let chromium;
try { ({ chromium } = require("playwright-core")); } catch { ({ chromium } = require("/Users/cloedana/kaskad-devis/node_modules/playwright-core")); }
const racine = path.resolve(__dirname, "../..");
const logo = "file://" + path.join(__dirname, "logo-clair-rouge.svg");
const VIOLET = "#59114D";

// Icône : le logo occupe une part de la largeur. « maskable » (Android) : tout tient dans le cercle central (80 %).
const icones = [
  { nom: "icone-192.png", taille: 192, part: 0.8 },
  { nom: "icone-512.png", taille: 512, part: 0.8 },
  { nom: "icone-maskable-512.png", taille: 512, part: 0.6 },
  { nom: "apple-touch-icon.png", taille: 180, part: 0.8 },
];
// Écrans de démarrage iPhone (portrait) : largeur et hauteur en points, densité.
const ecrans = [
  [440, 956, 3], [402, 874, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [375, 667, 2],
];

(async () => {
  const b = await chromium.launch();
  for (const i of icones) {
    const p = await b.newPage({ viewport: { width: i.taille, height: i.taille } });
    await p.setContent(`<body style="margin:0;width:${i.taille}px;height:${i.taille}px;background:${VIOLET};display:flex;align-items:center;justify-content:center"><img src="${logo}" style="width:${Math.round(i.taille * i.part)}px"></body>`);
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(racine, "public/pwa", i.nom) });
    await p.close();
  }
  for (const [l, h, d] of ecrans) {
    const p = await b.newPage({ viewport: { width: l, height: h }, deviceScaleFactor: d });
    await p.setContent(`<body style="margin:0;width:${l}px;height:${h}px;background:${VIOLET};display:flex;align-items:center;justify-content:center"><img src="${logo}" style="width:${Math.round(l * 0.52)}px"></body>`);
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(racine, "public/pwa", `demarrage-${l * d}x${h * d}.png`) });
    await p.close();
  }
  await b.close();
  console.log("icônes et écrans de démarrage générés");
})();
