// Allège un audio trop lourd dans le navigateur, avant l'envoi : voix en mono, AAC à 48 kb/s.
// Une séance d'1 h 15 passe d'environ 75 Mo à moins de 30 Mo, sans perte utile pour une voix.
//
// L'outil est ffmpeg compilé pour le navigateur. Sa partie JavaScript (quelques Ko) est servie
// depuis public/ffmpeg (copie de @ffmpeg/ffmpeg 0.12.14) : le compilateur de Next.js ne sait pas
// embarquer son « worker ». Le cœur (environ 30 Mo) vient d'unpkg, une version figée, et n'est
// chargé qu'au premier allègement.
import type { FFmpeg } from "@ffmpeg/ffmpeg";

const CORE = "https://unpkg.com/@ffmpeg/core@0.12.9/dist/esm";
let outil: Promise<FFmpeg> | null = null;

async function enBlob(url: string, type: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`téléchargement impossible : ${url}`);
  return URL.createObjectURL(new Blob([await r.arrayBuffer()], { type }));
}

async function charger(): Promise<FFmpeg> {
  const outilJs = (await import(/* turbopackIgnore: true */ /* webpackIgnore: true */ `${window.location.origin}/ffmpeg/index.js`)) as typeof import("@ffmpeg/ffmpeg");
  const ffmpeg = new outilJs.FFmpeg();
  const [coreURL, wasmURL] = await Promise.all([enBlob(`${CORE}/ffmpeg-core.js`, "text/javascript"), enBlob(`${CORE}/ffmpeg-core.wasm`, "application/wasm")]);
  await ffmpeg.load({ coreURL, wasmURL });
  return ffmpeg;
}

export async function allegerAudio(f: File, progression: (etape: "chargement" | "allegement", pct: number) => void): Promise<File> {
  progression("chargement", 0);
  outil ??= charger().catch((e) => {
    outil = null;
    throw e;
  });
  const ffmpeg = await outil;
  const suivre = ({ progress }: { progress: number }) => progression("allegement", Math.max(0, Math.min(99, Math.round(progress * 100))));
  ffmpeg.on("progress", suivre);
  const entree = `entree${f.name.slice(f.name.lastIndexOf(".")).toLowerCase() || ".m4a"}`;
  try {
    await ffmpeg.writeFile(entree, new Uint8Array(await f.arrayBuffer()));
    const code = await ffmpeg.exec(["-i", entree, "-vn", "-ac", "1", "-c:a", "aac", "-b:a", "48k", "-movflags", "+faststart", "sortie.m4a"]);
    if (code !== 0) throw new Error(`allègement impossible (code ${code})`);
    const sortie = (await ffmpeg.readFile("sortie.m4a")) as Uint8Array;
    const nom = `${f.name.replace(/\.[^.]+$/, "")} (allégé).m4a`;
    return new File([new Uint8Array(sortie)], nom, { type: "audio/mp4", lastModified: f.lastModified });
  } finally {
    ffmpeg.off("progress", suivre);
    await ffmpeg.deleteFile(entree).catch(() => {});
    await ffmpeg.deleteFile("sortie.m4a").catch(() => {});
  }
}
