"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { vocalDepose } from "@/lib/actions/cliente";
import { createClient } from "@/lib/supabase/client";

const MAX = 60;
const horloge = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// « Dire, plutôt qu'écrire » : une minute au plus, enregistrée depuis son espace, rangée dans son carnet.
export function Vocal({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [etat, setEtat] = useState<"repos" | "enregistre" | "envoi">("repos");
  const [secondes, setSecondes] = useState(0);
  const [message, setMessage] = useState("");
  const enregistreur = useRef<MediaRecorder | null>(null);
  const morceaux = useRef<Blob[]>([]);
  const debut = useRef(0);

  useEffect(() => {
    if (etat !== "enregistre") return;
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - debut.current) / 1000);
      setSecondes(s);
      if (s >= MAX) enregistreur.current?.stop();
    }, 250);
    return () => clearInterval(t);
  }, [etat]);

  async function commencer() {
    setMessage("");
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
      const r = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
      morceaux.current = [];
      r.ondataavailable = (e) => e.data.size && morceaux.current.push(e.data);
      r.onstop = async () => {
        flux.getTracks().forEach((p) => p.stop());
        const duree = Math.max(1, Math.round((Date.now() - debut.current) / 1000));
        const blob = new Blob(morceaux.current, { type: r.mimeType || "audio/webm" });
        setEtat("envoi");
        const ext = blob.type.includes("mp4") ? "m4a" : "webm";
        const chemin = `${clienteId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await createClient().storage.from("vocaux").upload(chemin, blob, { contentType: blob.type.includes("mp4") ? "audio/mp4" : "audio/webm" });
        const res = error ? { ok: false, message: "Ton vocal n’a pas pu partir. Réessaie." } : await vocalDepose(chemin, duree);
        setMessage(res.message ?? "");
        setEtat("repos");
        setSecondes(0);
        if (res.ok) router.refresh();
      };
      enregistreur.current = r;
      debut.current = Date.now();
      r.start();
      setEtat("enregistre");
    } catch {
      setMessage("Le micro n’est pas accessible. Autorise-le dans ton navigateur, ou écris plutôt.");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={etat === "envoi"}
          onClick={() => (etat === "enregistre" ? enregistreur.current?.stop() : commencer())}
          aria-label={etat === "enregistre" ? "Arrêter le vocal" : "Enregistrer un vocal"}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-rouge disabled:opacity-60"
        >
          {etat === "enregistre" ? <span aria-hidden className="size-4 rounded-[3px] bg-creme" /> : <span aria-hidden className="size-4 rounded-full bg-creme" />}
        </button>
        <div className="flex flex-col">
          <span className="font-titre text-[16px] font-semibold text-creme">{etat === "enregistre" ? "Je t’écoute" : etat === "envoi" ? "Je range ton vocal…" : "Dire, plutôt qu’écrire"}</span>
          <span className="text-[14px] text-creme/80">{etat === "enregistre" ? `${horloge(secondes)} · une minute au plus` : "une minute au plus, rangée dans ton carnet"}</span>
        </div>
      </div>
      {message ? (
        <p role="status" className="m-0 text-[14px] text-rose">
          {message}
        </p>
      ) : null}
    </div>
  );
}
