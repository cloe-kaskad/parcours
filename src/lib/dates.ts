const TZ = "Europe/Paris";

export function dateLongue(d: string | null | undefined) {
  if (!d) return "à définir";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(d));
}

export function dateHeure(d: string | null | undefined) {
  if (!d) return "à définir";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(d));
}

export function dateCourte(d: string | null | undefined) {
  if (!d) return "à définir";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(
    new Date(d),
  );
}

// Valeur pour un <input type="datetime-local"> en heure de Paris.
export function pourInputDateHeure(d: string | null | undefined) {
  if (!d) return "";
  const parts = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).formatToParts(new Date(d));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// Convertit une valeur de datetime-local (heure de Paris) en ISO UTC.
export function depuisInputDateHeure(v: string): string | null {
  if (!v) return null;
  const [date, heure] = v.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (heure ?? "00:00").split(":").map(Number);
  // Décalage Paris : on calcule l'offset à cette date via Intl.
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const parisParts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(guess);
  const g = (t: string) => Number(parisParts.find((p) => p.type === t)?.value ?? 0);
  const asParis = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"));
  const offset = asParis - guess.getTime();
  return new Date(guess.getTime() - offset).toISOString();
}

export function joursDepuis(d: string | null | undefined) {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
}

// Prochaine séance planifiée à partir de maintenant (hors rendu React, pour la règle de pureté).
export function prochaineSeance<T extends { statut: string; date: string | null }>(seances: T[]): T | null {
  const maintenant = Date.now();
  return seances.find((s) => s.statut === "planifiee" && s.date && new Date(s.date).getTime() >= maintenant) ?? null;
}

// Ouverture de la plateforme. Ce qui est daté d'avant vient de la migration Notion :
// ces dates ne sont pas réelles et ces séances ne déclenchent aucun rappel.
const OUVERTURE = Date.parse("2026-11-08T00:00:00+01:00");

export function avantOuverture(d: string | null | undefined) {
  return Boolean(d) && new Date(d as string).getTime() < OUVERTURE;
}

// Date du jour à Paris, au format AAAA-MM-JJ.
export function aujourdhuiParis() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

const partie = (d: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { ...o, timeZone: TZ }).format(new Date(d));

// « nov », « sept », pour le petit calendrier.
export function moisCalendrier(d: string) {
  return partie(d, { month: "short" }).replace(".", "");
}

export function jourCalendrier(d: string) {
  return partie(d, { day: "numeric" });
}

// « 23 octobre »
export function jourEtMois(d: string) {
  return partie(d, { day: "numeric", month: "long" });
}

// « 4 nov. »
export function jourEtMoisCourt(d: string) {
  return partie(d, { day: "numeric", month: "short" });
}

// « lundi 16 novembre · 15h » ou « · 15h30 »
export function jourEtHeure(d: string) {
  const jour = partie(d, { weekday: "long", day: "numeric", month: "long" });
  const h = partie(d, { hour: "numeric", hour12: false }).replace(/\D/g, "");
  const m = partie(d, { minute: "numeric" }).padStart(2, "0");
  return jour + " · " + Number(h) + "h" + (m === "00" ? "" : m);
}

// « jeudi 23 octobre »
export function jourComplet(d: string) {
  return partie(d, { weekday: "long", day: "numeric", month: "long" });
}
