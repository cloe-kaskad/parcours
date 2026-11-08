import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const champBase =
  "w-full min-w-0 max-w-full rounded-xl border border-champ-bord bg-champ px-4 py-2.5 text-base text-encre outline-none transition focus:border-violet focus:ring-2 focus:ring-violet/20 disabled:opacity-60";

export function Champ({ label, aide, ...props }: ComponentProps<"input"> & { label: string; aide?: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm font-medium text-violet">{label}</span>
      <input className={champBase} {...props} />
      {aide ? <span className="text-xs text-texte-doux">{aide}</span> : null}
    </label>
  );
}

export function Zone({ label, aide, ...props }: ComponentProps<"textarea"> & { label: string; aide?: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm font-medium text-violet">{label}</span>
      <textarea className={`${champBase} min-h-28 leading-relaxed`} {...props} />
      {aide ? <span className="text-xs text-texte-doux">{aide}</span> : null}
    </label>
  );
}

export function Selection({ label, children, ...props }: ComponentProps<"select"> & { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm font-medium text-violet">{label}</span>
      <select className={champBase} {...props}>
        {children}
      </select>
    </label>
  );
}

export function Case({ label, ...props }: ComponentProps<"input"> & { label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-texte">
      <input type="checkbox" className="h-4 w-4 accent-violet" {...props} />
      {label}
    </label>
  );
}

type Variante = "primaire" | "secondaire" | "discret" | "danger" | "clair";
const variantes: Record<Variante, string> = {
  primaire: "bg-rouge text-white hover:bg-[#cf2f18] shadow-[0_6px_18px_-8px_rgba(230,54,29,0.7)]",
  secondaire: "bg-violet text-creme hover:bg-violet-clair",
  clair: "bg-creme text-violet hover:bg-white",
  discret: "text-texte-doux hover:text-violet",
  danger: "text-rouge hover:bg-rouge/10",
};

export function Bouton({ variante = "primaire", className = "", ...props }: ComponentProps<"button"> & { variante?: Variante }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60 ${variantes[variante]} ${className}`}
      {...props}
    />
  );
}

export function LienBouton({
  href,
  variante = "secondaire",
  children,
  className = "",
}: {
  href: string;
  variante?: Variante;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ${variantes[variante]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Carte({
  titre,
  action,
  children,
  className = "",
  id,
}: {
  titre?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`carte bloc min-w-0 p-5 md:p-6 ${className}`}>
      {titre || action ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {titre ? <h2 className="text-[1.35rem] font-bold">{titre}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Pastille({ children, ton = "neutre" }: { children: ReactNode; ton?: "neutre" | "ok" | "alerte" | "violet" | "rose" }) {
  const tons = {
    neutre: "bg-encre/8 text-texte",
    ok: "bg-emerald-600/12 text-emerald-800",
    alerte: "bg-rouge/12 text-rouge",
    violet: "bg-violet/10 text-violet",
    rose: "bg-rose text-violet",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tons[ton]}`}>{children}</span>;
}

export function Vide({ children }: { children: ReactNode }) {
  return <p className="text-base leading-relaxed text-texte-doux">{children}</p>;
}

export function Message({ type, children }: { type: "ok" | "erreur"; children: ReactNode }) {
  return (
    <p
      role={type === "erreur" ? "alert" : "status"}
      className={`rounded-xl px-4 py-3 text-sm ${type === "erreur" ? "bg-rouge/10 text-rouge" : "bg-emerald-600/12 text-emerald-800"}`}
    >
      {children}
    </p>
  );
}

export function FilAriane({ elements }: { elements: { href?: string; label: string }[] }) {
  return (
    <nav className="mb-3 text-sm text-gris" aria-label="Fil d'Ariane">
      {elements.map((e, i) => (
        <span key={i}>
          {i > 0 ? <span className="mx-2 opacity-60">/</span> : null}
          {e.href ? (
            <Link href={e.href} className="hover:text-violet">
              {e.label}
            </Link>
          ) : (
            <span className="text-encre">{e.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// Ligne cliquable d'une liste (séance, cliente…), avec flèche.
export function Ligne({ href, children, aside }: { href: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <li>
      <Link href={href} className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition hover:bg-encre/4">
        <div className="min-w-0 flex-1">{children}</div>
        <div className="flex shrink-0 items-center gap-2">
          {aside}
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-gris" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </div>
      </Link>
    </li>
  );
}
