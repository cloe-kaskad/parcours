"use client";

import { useState } from "react";

// « Mode en séance » : le bouton est là ; l'écran épuré pendant la visio vient au temps 2.
export function ModeEnSeance() {
  const [note, setNote] = useState(false);
  return (
    <div className="flex flex-col items-start gap-1.5">
      <button type="button" onClick={() => setNote(true)} className="bouton-rouge">
        Mode en séance
      </button>
      {note ? (
        <p role="status" className="m-0 max-w-[30ch] text-[14px] leading-[1.45] text-violet/85">
          L’écran du mode en séance arrive avec le temps 2.
        </p>
      ) : null}
    </div>
  );
}
