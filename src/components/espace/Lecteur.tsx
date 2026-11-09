// Une musique pour l'état du jour.
export function Lecteur({ titre, artiste, url }: { titre: string; artiste: string; url: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-[var(--rayon-lecteur)] bg-violet-nuit px-3.5 py-3 md:bg-violet">
      <a href={url} target="_blank" rel="noreferrer" aria-label={`Écouter ${titre}`} className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-rose">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
          <path d="M4 2 L14 8 L4 14 Z" fill="#3D0A34" />
        </svg>
      </a>
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <p className="text-[11px] tracking-[0.02em] text-rose">Une musique pour ce moment</p>
        <p className="font-titre text-[17px] font-semibold leading-[1.05] text-creme">{titre}</p>
        {artiste ? <p className="font-italique text-[12px] italic text-creme/70">{artiste}</p> : null}
      </div>
    </div>
  );
}
