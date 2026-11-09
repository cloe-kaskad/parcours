// Calcule le dessin du chemin : une station par séance faite, puis une station vide devant.
// La graine (l'identifiant du parcours) garde le même dessin d'une visite à l'autre.

export type Station = { id: string; nom: string | null };
export type Point = { x: number; y: number; rayon: number };
export type MotPose = { texte: string; x: number; y: number; taille: number; poids: number; opacite: number };
export type Trace = { d: string; points: Point[]; vide: Point; mots: MotPose[] };

export type Format = { largeur: number; hauteur: number; tailles: number[] };
export const FORMAT_MOBILE: Format = { largeur: 390, hauteur: 206, tailles: [21, 16, 13, 12, 11, 11] };
export const FORMAT_LARGE: Format = { largeur: 1280, hauteur: 220, tailles: [30, 22, 15, 14, 13, 13] };

function aleas(graine: string) {
  let h = 2166136261;
  for (const c of graine) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const arrondi = (n: number) => Math.round(n * 10) / 10;

// Courbe lisse qui passe exactement par chaque point.
function courbe(p: { x: number; y: number }[]) {
  let d = `M ${arrondi(p[0].x)} ${arrondi(p[0].y)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i];
    const b = p[i];
    const c = p[i + 1];
    const e = p[i + 2] ?? c;
    d += ` C ${arrondi(b.x + (c.x - a.x) / 6)} ${arrondi(b.y + (c.y - a.y) / 6)}, ${arrondi(c.x - (e.x - b.x) / 6)} ${arrondi(c.y - (e.y - b.y) / 6)}, ${arrondi(c.x)} ${arrondi(c.y)}`;
  }
  return d;
}

type Boite = { g: number; d: number; h: number; b: number };
const touche = (a: Boite, b: Boite) => a.g < b.d + 6 && b.g < a.d + 6 && a.h < b.b + 3 && b.h < a.b + 3;

export function tracerChemin(stations: Station[], graine: string, { largeur, hauteur, tailles }: Format): Trace {
  const hasard = aleas(graine);
  const n = stations.length;
  const haut = hauteur * 0.4;
  const bas = hauteur * 0.76;
  const debut = largeur * 0.046;
  const finStations = largeur * 0.865;
  const pas = n > 1 ? (finStations - debut) / (n - 1) : 0;
  const onde = hauteur * 0.05;

  const points: Point[] = stations.map((_, i) => {
    const t = n > 1 ? i / (n - 1) : 0;
    const ecart = (i % 2 ? 1 : -0.4) * onde * (0.5 + hasard());
    return {
      x: debut + pas * i,
      y: bas - (bas - haut) * t + ecart,
      rayon: i === n - 1 ? 4.5 : i === n - 2 ? 4 : 3.5,
    };
  });
  const dernier = points[n - 1];
  const vide: Point = { x: largeur * 0.955, y: (dernier?.y ?? bas) - hauteur * 0.08, rayon: 4 };
  const d = courbe([
    { x: -12, y: (points[0]?.y ?? bas) + 4 },
    ...points,
    vide,
    { x: largeur + 12, y: vide.y - hauteur * 0.05 },
  ]);

  // Les mots se posent du plus récent au plus ancien ; un mot qui ne trouve pas sa place
  // reste dans la mémoire, jamais par-dessus un autre.
  const mots: MotPose[] = [];
  const boites: Boite[] = points.map((p) => ({ g: p.x - 6, d: p.x + 6, h: p.y - 6, b: p.y + 6 }));
  let rang = 0;
  for (let i = n - 1; i >= 0; i--) {
    const texte = stations[i].nom?.trim();
    if (!texte) continue;
    const taille = tailles[Math.min(rang, tailles.length - 1)];
    const l = texte.length * taille * 0.52;
    const p = points[i];
    const g = Math.min(Math.max(6, p.x - l / 2), largeur - l - 12);
    for (const y of [p.y - 14, p.y + taille + 10, p.y - 14 - taille - 6, p.y + 2 * taille + 16]) {
      const boite = { g, d: g + l, h: y - taille, b: y + 2 };
      if (boite.h < 4 || boite.b > hauteur - 4 || boites.some((b) => touche(boite, b))) continue;
      boites.push(boite);
      mots.push({ texte, x: arrondi(g), y: arrondi(y), taille, poids: rang < 2 ? 600 : 500, opacite: Math.max(0.75, 1 - rang * 0.05) });
      rang++;
      break;
    }
  }

  return { d, points, vide, mots };
}
