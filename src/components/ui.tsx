import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const champBase =
  "w-full rounded-xl border border-beige bg-white px-4 py-2.5 text-base outline-none transition focus:border-violet focus:ring-2 focus:ring-violet/20 disabled:opacity-60";

export function Champ({
  label,
  aide,
  ...props
}: ComponentProps<"input"> & { label: string; aide?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-violet">{label}</span>
      <input className={champBase} {...props} />
      {aide ? <span className="text-xs text-gris">{aide}</span> : null}
    </label>
  );
}

export function Zone({
  label,
  aide,
  ...props
}: ComponentProps<"textarea"> & { label: string; aide?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-violet">{label}</span>
      <textarea className={`${champBase} min-h-28 leading-relaxed`} {...props} />
      {aide ? <span className="text-xs text-gris">{aide}</span> : null}
    </label>
  );
}

export function Selection({
  label,
  children,
  ...props
}: ComponentProps<"select"> & { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-violet">{label}</span>
      <select className={champBase} {...props}>
        {children}
      </select>
    </label>
  );
}

export function Case({ label, ...props }: ComponentProps<"input"> & { label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-encre">
      <input type="checkbox" className="h-4 w-4 accent-violet" {...props} />
      {label}
    </label>
  );
}

type Variante = "primaire" | "secondaire" | "discret" | "danger";
const variantes: Record<Variante, string> = {
  primaire: "bg-violet text-white hover:bg-violet-clair",
  secondaire: "border border-violet text-violet hover:bg-violet/5",
  discret: "text-gris hover:text-violet",
  danger: "text-rouge hover:bg-rouge/10",
};

export function Bouton({
  variante = "primaire",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return (
    <button
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${variantes[variante]} ${className}`}
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
      className={`inline-block rounded-xl px-4 py-2.5 text-sm font-semibold transition ${variantes[variante]} ${className}`}
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
}: {
  titre?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`bloc rounded-2xl bg-white/70 p-6 ${className}`}>
      {titre || action ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {titre ? <h2 className="text-xl font-bold">{titre}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Pastille({ children, ton = "neutre" }: { children: ReactNode; ton?: "neutre" | "ok" | "alerte" | "violet" }) {
  const tons = {
    neutre: "bg-beige text-encre",
    ok: "bg-emerald-100 text-emerald-800",
    alerte: "bg-rouge/10 text-rouge",
    violet: "bg-violet/10 text-violet",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tons[ton]}`}>{children}</span>;
}

export function Vide({ children }: { children: ReactNode }) {
  return <p className="text-base text-gris">{children}</p>;
}

export function Message({ type, children }: { type: "ok" | "erreur"; children: ReactNode }) {
  return (
    <p
      role={type === "erreur" ? "alert" : "status"}
      className={`rounded-xl px-4 py-3 text-sm ${type === "erreur" ? "bg-rouge/10 text-rouge" : "bg-emerald-100 text-emerald-800"}`}
    >
      {children}
    </p>
  );
}

export function FilAriane({ elements }: { elements: { href?: string; label: string }[] }) {
  return (
    <nav className="mb-4 text-sm text-gris" aria-label="Fil d'Ariane">
      {elements.map((e, i) => (
        <span key={i}>
          {i > 0 ? <span className="mx-2">/</span> : null}
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
