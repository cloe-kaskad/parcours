"use client";

import { useRef, useState, useTransition } from "react";
import { TexteLettre } from "@/components/espace/TexteLettre";
import { enregistrerAccroche, enregistrerLettre, envoyerLettre } from "@/lib/actions/lettres";
import { descriptionExercice, lireLettre } from "@/lib/lettre";

type Source = { libelle: string; titre: string; texte: string };

function heureLocale() {
  return new Intl.DateTimeFormat("fr-FR", { hour: "numeric", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date()).replace(":", "h");
}

function Apercu({ contenu }: { contenu: string }) {
  const { preambule, chapitres } = lireLettre(contenu);
  return (
    <div className="flex flex-col">
      {preambule ? <TexteLettre>{preambule}</TexteLettre> : null}
      {chapitres.map((c) => (
        <section key={c.slug} className="flex flex-col gap-4 pt-9">
          <h2 className="t-exercice">{c.titre}</h2>
          <TexteLettre>{c.texte}</TexteLettre>
        </section>
      ))}
    </div>
  );
}

// Une ligne par exercice, celle que la cliente lit sous le titre quand l'exercice est fermé.
function Accroches({ id, prenom, contenu, initiales }: { id: string; prenom: string; contenu: string; initiales: Record<string, string> }) {
  const { chapitres } = lireLettre(contenu);
  const [valeurs, setValeurs] = useState(initiales);
  const [etat, setEtat] = useState<Record<string, string>>({});
  const enregistrees = useRef({ ...initiales });
  if (!chapitres.length) return null;
  const sauver = async (slug: string) => {
    const v = valeurs[slug] ?? "";
    if (v === (enregistrees.current[slug] ?? "")) return;
    setEtat((e) => ({ ...e, [slug]: "…" }));
    const r = await enregistrerAccroche(id, slug, v);
    setEtat((e) => ({ ...e, [slug]: r.ok ? "enregistrée" : r.message }));
    if (r.ok) enregistrees.current[slug] = v;
  };
  return (
    <section className="flex flex-col gap-3 border-t border-violet/20 pt-5">
      <h2 className="font-titre text-[17px] font-semibold text-violet">La ligne sous chaque exercice</h2>
      <p className="-mt-1.5 text-[14px] text-violet/80">Ce que {prenom} lit sous le titre, exercice fermé. Laissée vide : les premiers mots de l’exercice.</p>
      {chapitres.map((c) => (
        <label key={c.slug} className="flex flex-col gap-1">
          <span className="text-[14px] font-semibold text-encre">{c.titre}</span>
          <input
            type="text"
            maxLength={160}
            value={valeurs[c.slug] ?? ""}
            placeholder={descriptionExercice(c.texte)}
            onChange={(e) => setValeurs((v) => ({ ...v, [c.slug]: e.target.value }))}
            onBlur={() => sauver(c.slug)}
            className="champ-zone min-h-[44px] px-3 py-2 text-[15px]"
          />
          {etat[c.slug] ? <span className="text-[14px] text-violet/80">{etat[c.slug]}</span> : null}
        </label>
      ))}
    </section>
  );
}

// Si le collage arrive en texte riche sans Markdown, on convertit pour garder titres, gras et listes.
async function versMarkdown(e: React.ClipboardEvent<HTMLTextAreaElement>) {
  const html = e.clipboardData.getData("text/html");
  const texte = e.clipboardData.getData("text/plain");
  if (!html || /^(#{1,6} |> |- |\* )|\*\*/m.test(texte)) return null;
  e.preventDefault();
  const { default: Turndown } = await import("turndown");
  return new Turndown({ headingStyle: "atx", bulletListMarker: "-", emDelimiter: "*" }).turndown(html);
}

export function EditeurLettre({
  id,
  prenom,
  titreInitial,
  contenuInitial,
  dejaEnvoyee,
  sources,
  accroches,
}: {
  id: string;
  prenom: string;
  titreInitial: string;
  contenuInitial: string;
  dejaEnvoyee: boolean;
  sources: Source[];
  accroches: Record<string, string>;
}) {
  const [titre, setTitre] = useState(titreInitial);
  const [contenu, setContenu] = useState(contenuInitial);
  const [statut, setStatut] = useState(dejaEnvoyee ? "pratiques envoyées" : "brouillon");
  const [source, setSource] = useState(sources[0]?.libelle ?? "");
  const [envoyee, setEnvoyee] = useState(false);
  const [copie, setCopie] = useState(false);
  const [erreur, setErreur] = useState("");
  const [enCours, demarrer] = useTransition();
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zone = useRef<HTMLTextAreaElement>(null);
  const courante = sources.find((s) => s.libelle === source);
  const whatsapp = `${prenom}, tes exercices sont dans ton espace : parcours.amarecherche.fr`;

  function sauver(t: string, c: string) {
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = null;
    demarrer(async () => {
      const r = await enregistrerLettre(id, t, c);
      setStatut(r.ok ? `${dejaEnvoyee ? "enregistrée" : "brouillon enregistré"} à ${heureLocale()}` : r.message);
    });
  }

  function planifier(t: string, c: string) {
    setStatut("modifications en cours…");
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => sauver(t, c), 1500);
  }

  function envoyer() {
    if (minuterie.current) clearTimeout(minuterie.current);
    setErreur("");
    demarrer(async () => {
      const r = await envoyerLettre(id, titre, contenu);
      if (!r.ok) return setErreur(r.message);
      setStatut(`pratiques envoyées à ${heureLocale()}`);
      setEnvoyee(true);
    });
  }

  return (
    <>
      <div className="px-[22px] pt-[26px] md:px-10">
        <div className="flex flex-col gap-1.5">
          <p role="status" className="m-0 font-titre text-[14px] font-semibold text-violet">
            {statut}
          </p>
          <input
            aria-label="Titre des pratiques"
            value={titre}
            onChange={(e) => {
              setTitre(e.target.value);
              planifier(e.target.value, contenu);
            }}
            className="w-full bg-transparent font-titre text-[34px] font-semibold leading-[0.95] tracking-[-0.03em] text-violet outline-none"
          />
          <p className="font-italique text-[14px] italic text-violet">{prenom} · colle tes pratiques ici, la mise en forme est gardée</p>
        </div>
      </div>
      <div className="flex flex-col gap-6 px-[22px] pb-14 pt-5 md:grid md:grid-cols-[1fr_380px] md:gap-10 md:px-10">
        <div className="flex min-w-0 flex-col gap-5">
          <textarea
            ref={zone}
            aria-label="Les pratiques"
            value={contenu}
            placeholder={"Colle tes pratiques ici.\n\n## Le titre d’un exercice\n\nLa consigne…\n\n> Pourquoi ça compte\n> Le texte de l’encadré."}
            onChange={(e) => {
              setContenu(e.target.value);
              planifier(titre, e.target.value);
            }}
            onPaste={async (e) => {
              const el = e.currentTarget;
              const debut = el.selectionStart;
              const fin = el.selectionEnd;
              const md = await versMarkdown(e);
              if (md === null) return;
              const suite = contenu.slice(0, debut) + md + contenu.slice(fin);
              setContenu(suite);
              planifier(titre, suite);
            }}
            className="min-h-[320px] w-full resize-y border-t border-violet/20 bg-transparent pt-5 text-[16px] leading-[1.6] text-encre outline-none placeholder:text-encre/45"
          />
          <p className="text-[14px] text-violet/70">Un titre (##) fait un exercice. Une citation (&gt;) ou un paragraphe qui commence par « Pourquoi ça compte » fait un encadré.</p>

          <Accroches id={id} prenom={prenom} contenu={contenu} initiales={accroches} />

          {contenu.trim() ? (
            <section className="flex flex-col gap-3 border-t border-violet/20 pt-5">
              <h2 className="font-italique text-[14px] italic text-violet">Ce que {prenom} lira</h2>
              <Apercu contenu={contenu} />
            </section>
          ) : null}

          {envoyee ? (
            <div className="carte-blanche flex flex-col gap-2.5 px-[18px] py-4">
              <p className="font-titre text-[18px] font-semibold text-violet">Envoyée. Préviens-la sur WhatsApp.</p>
              <p className="rounded-[6px] border border-carte-filet px-3.5 py-3 text-[15px] leading-[1.5]">{whatsapp}</p>
              <div className="flex gap-[18px]">
                <button
                  type="button"
                  className="t-action min-h-[44px] text-[15px] text-rouge"
                  onClick={async () => {
                    await navigator.clipboard.writeText(whatsapp);
                    setCopie(true);
                  }}
                >
                  {copie ? "Copié" : "Copier le texte"}
                </button>
                <button type="button" className="t-action min-h-[44px] text-[15px] text-violet" onClick={() => setEnvoyee(false)}>
                  retour
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-[18px]">
              {!dejaEnvoyee ? (
                <button type="button" disabled={enCours} onClick={envoyer} className="bouton-rouge disabled:opacity-50">
                  Envoyer à {prenom}
                </button>
              ) : null}
              <button type="button" disabled={enCours} onClick={() => sauver(titre, contenu)} className="t-action min-h-[44px] text-[15px] text-violet disabled:opacity-50">
                {dejaEnvoyee ? "Enregistrer" : "Enregistrer le brouillon"}
              </button>
              {erreur ? (
                <span role="alert" className="text-[14px] text-rouge">
                  {erreur}
                </span>
              ) : null}
            </div>
          )}
        </div>

        <aside className="order-first flex flex-col gap-2.5 md:order-last md:sticky md:top-6 md:self-start">
          <div className="flex flex-wrap gap-1.5">
            {sources.map((s) => (
              <button key={s.libelle} type="button" aria-pressed={source === s.libelle} className="source" onClick={() => setSource(source === s.libelle ? "" : s.libelle)}>
                {s.libelle}
              </button>
            ))}
          </div>
          {courante ? (
            <div className="carte-blanche flex max-h-[220px] flex-col gap-1.5 overflow-y-auto px-4 py-3.5 md:max-h-[70vh]">
              <p className="font-italique text-[14px] italic text-violet">{courante.titre}</p>
              <p className="whitespace-pre-line text-[14px] leading-[1.5]">{courante.texte}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}
