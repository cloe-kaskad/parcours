"use client";

import { useRef, useState } from "react";

const VITESSES: [number, string][] = [
  [1, "1x"],
  [1.25, "1,25x"],
  [1.5, "1,5x"],
];

function horloge(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const c = String(Math.floor(s % 60)).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${c}` : `${m}:${c}`;
}

function lire(cle: string) {
  try {
    return Number(localStorage.getItem(cle)) || 0;
  } catch {
    return 0;
  }
}

// Le lecteur d'Émilien : vitesse, et reprise là où il s'était arrêté, sur cet appareil.
export function LecteurEmilien({ src, seanceId, dureeConnue }: { src: string; seanceId: string; dureeConnue: number | null }) {
  const audio = useRef<HTMLAudioElement>(null);
  const derniere = useRef(0);
  const cle = `position-seance-${seanceId}`;
  const [lecture, setLecture] = useState(false);
  const [position, setPosition] = useState(0);
  const [duree, setDuree] = useState(dureeConnue ?? 0);
  const [vitesse, setVitesse] = useState(1);
  const [repris, setRepris] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-[var(--rayon-lecteur)] bg-violet-nuit px-4 py-3.5 text-creme">
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          setDuree(e.currentTarget.duration);
          const memo = lire(cle);
          if (memo > 5 && memo < e.currentTarget.duration - 5) {
            e.currentTarget.currentTime = memo;
            setPosition(memo);
            setRepris(true);
          }
        }}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setPosition(t);
          if (Math.abs(t - derniere.current) >= 5) {
            derniere.current = t;
            try {
              localStorage.setItem(cle, String(Math.floor(t)));
            } catch {
              // navigation privée : la position n'est pas gardée
            }
          }
        }}
        onPlay={() => setLecture(true)}
        onPause={() => setLecture(false)}
      />
      <div className="flex items-center gap-3.5">
        <button type="button" aria-label={lecture ? "Mettre en pause" : "Écouter"} onClick={() => (lecture ? audio.current?.pause() : audio.current?.play())} className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-rose">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="#3D0A34">
            {lecture ? <path d="M3 2h4v12H3zM9 2h4v12H9z" /> : <path d="M4 2 L14 8 L4 14 Z" />}
          </svg>
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <input
            type="range"
            min={0}
            max={duree || 0}
            value={position}
            aria-label="Position dans l’audio"
            onChange={(e) => {
              if (audio.current) audio.current.currentTime = Number(e.target.value);
            }}
            className="h-1 w-full accent-rose"
          />
          <div className="flex justify-between text-[11px] opacity-80">
            <span>
              {horloge(position)}
              {repris ? " · repris où tu t’étais arrêté" : ""}
            </span>
            <span>{horloge(duree)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="pr-1 text-[11px] opacity-70">vitesse</span>
        {VITESSES.map(([v, l]) => (
          <button
            key={l}
            type="button"
            aria-pressed={vitesse === v}
            onClick={() => {
              setVitesse(v);
              if (audio.current) audio.current.playbackRate = v;
            }}
            className={`min-h-[36px] rounded-full border px-2.5 pb-1 pt-1.5 font-titre text-[12px] font-semibold ${vitesse === v ? "border-rose bg-rose text-violet-nuit" : "border-rose/50 text-creme"}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
