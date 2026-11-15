"use client";

import { useRef, useState, useTransition } from "react";
import { enregistrerVersionSeance } from "@/lib/actions/seances";
import { blocsDe, marquerALire, NOM_INTEGRAL, type SectionSeance, versMarkdown } from "@/lib/version-seance";
import { TexteLecture } from "./TexteLecture";

// La version séance, modifiable section par section. Le titre et l'ordre restent ceux de la préparation.
export function EditeurVersionSeance({ seanceId, initiales, source }: { seanceId: string; initiales: SectionSeance[]; source: string[] }) {
  const [textes, setTextes] = useState(() => initiales.map((s) => versMarkdown(s.blocs)));
  const [durees, setDurees] = useState(() => initiales.map((s) => s.duree));
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [enCours, demarrer] = useTransition();
  const zones = useRef<(HTMLTextAreaElement | null)[]>([]);

  const dire = (i: number, m: string) => setMessages((x) => ({ ...x, [i]: m }));

  const enregistrer = (i: number) => {
    const sections = initiales.map((s, k) => ({ titre: s.titre, duree: durees[k].trim(), blocs: blocsDe(textes[k]) }));
    dire(i, "…");
    demarrer(async () => {
      const r = await enregistrerVersionSeance(seanceId, sections);
      dire(i, r.message ?? (r.ok ? "Enregistré." : "Pas enregistré."));
    });
  };

  const marquer = (i: number) => {
    const el = zones.current[i];
    if (!el || el.selectionStart === el.selectionEnd) return dire(i, "Sélectionne d’abord le texte à lire en entier.");
    const r = marquerALire(textes[i], el.selectionStart, el.selectionEnd);
    setTextes((t) => t.map((x, k) => (k === i ? r.texte : x)));
    dire(i, "Marqué : il doit rester mot pour mot celui de la préparation.");
  };

  return (
    <div className="flex flex-col gap-5">
      {initiales.map((s, i) => (
        <section key={i} className="flex flex-col overflow-hidden rounded-[12px] border border-carte-filet bg-white">
          <div className="flex items-center gap-3 bg-violet px-4 py-3 text-creme lg:px-5">
            <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-creme pt-0.5 font-titre text-[15px] font-bold text-violet">{i + 1}</span>
            <h2 className="m-0 min-w-0 flex-1 font-titre text-[22px] font-semibold leading-none tracking-[-0.02em] lg:text-[26px]">{s.titre}</h2>
          </div>
          <div className="flex flex-col gap-3 px-4 pb-4 pt-3.5 lg:px-5">
            <label className="flex flex-col gap-1 text-[14px] text-violet">
              Repère de temps (facultatif)
              <input value={durees[i]} onChange={(e) => setDurees((d) => d.map((x, k) => (k === i ? e.target.value : x)))} placeholder="10 à 20 min" className="champ max-w-[16rem] text-[16px]" />
            </label>
            <textarea
              ref={(el) => {
                zones.current[i] = el;
              }}
              aria-label={`Section ${i + 1}, ${s.titre}`}
              value={textes[i]}
              onChange={(e) => setTextes((t) => t.map((x, k) => (k === i ? e.target.value : x)))}
              className="champ-zone min-h-[200px] bg-papier text-[16px] leading-[1.6]"
            />
            <p className="m-0 text-[13px] leading-[1.45] text-violet/85">Un texte à lire en entier est entre une ligne « :::a-lire » et une ligne « ::: ». Ne change pas ses mots.</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <button type="button" disabled={enCours} onClick={() => enregistrer(i)} className="pilule pilule-rouge min-h-[44px] disabled:opacity-60">
                Enregistrer
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => marquer(i)} className="outil min-h-[44px] text-[14px]">
                {NOM_INTEGRAL}
              </button>
            </div>
            {messages[i] ? (
              <p role="status" className="m-0 text-[14px] text-violet">
                {messages[i]}
              </p>
            ) : null}
            {source[i]?.trim() ? (
              <details className="group">
                <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-titre text-[14px] font-semibold text-violet underline underline-offset-[3px]">Cette section dans la préparation</summary>
                <div className="pt-2">
                  <TexteLecture className="text-[16px]">{source[i]}</TexteLecture>
                </div>
              </details>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
