"use client";

import { useRef, useState } from "react";

function horloge(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const c = String(Math.floor(s % 60)).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${c}` : `${m}:${c}`;
}

// Le lecteur d'une carte : un bouton rond, une ligne de progression qu'on peut toucher, le temps.
export function PetitLecteur({ src, titre }: { src: string; titre: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [lecture, setLecture] = useState(false);
  const [position, setPosition] = useState(0);
  const [duree, setDuree] = useState(0);

  return (
    <div className="flex items-center gap-3">
      <audio
        ref={audio}
        src={src}
        preload="none"
        onLoadedMetadata={(e) => setDuree(e.currentTarget.duration)}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        onPlay={() => setLecture(true)}
        onPause={() => setLecture(false)}
      />
      <button
        type="button"
        aria-label={lecture ? `Mettre en pause ${titre}` : `Écouter ${titre}`}
        onClick={() => (lecture ? audio.current?.pause() : audio.current?.play())}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet"
      >
        {lecture ? (
          <svg aria-hidden width="14" height="14" viewBox="0 0 16 16">
            <path d="M4 2h3v12H4zM9 2h3v12H9z" fill="#F5EDE3" />
          </svg>
        ) : (
          <svg aria-hidden width="14" height="14" viewBox="0 0 16 16">
            <path d="M4 2 L14 8 L4 14 Z" fill="#F5EDE3" />
          </svg>
        )}
      </button>
      <input
        type="range"
        aria-label="Position dans la séance"
        min={0}
        max={duree || 1}
        step={1}
        value={position}
        onChange={(e) => {
          if (audio.current) audio.current.currentTime = Number(e.target.value);
        }}
        className="h-11 min-w-0 flex-1 cursor-pointer accent-[var(--violet)]"
      />
      <span className="shrink-0 text-[13px] tabular-nums text-violet">{horloge(position)}</span>
    </div>
  );
}
