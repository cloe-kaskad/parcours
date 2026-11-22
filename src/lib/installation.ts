// L'application installable, côté navigateur (brief du 22 novembre, point 1).

type InvitationNavigateur = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
declare global {
  interface Window {
    invitationInstallation?: InvitationNavigateur | null;
  }
}

export const EVENEMENT = "installation-possible";
const CLE_REFUS = "installation-refusee";
const UN_MOIS = 30 * 24 * 60 * 60 * 1000;

// Déjà ouverte depuis l'écran d'accueil ?
export function estInstallee() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export type Plateforme = "iphone-safari" | "iphone-autre" | "android" | "ordinateur";
export function plateforme(): Plateforme {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua) ? "iphone-autre" : "iphone-safari";
  if (/Android/.test(ua)) return "android";
  return "ordinateur";
}

// Le bouton d'installation du navigateur (Chrome, Edge, Samsung sur Android) : l'événement arrive tôt, on le garde.
export function ecouterInvitation() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.invitationInstallation = e as InvitationNavigateur;
    window.dispatchEvent(new Event(EVENEMENT));
  });
  window.addEventListener("appinstalled", () => {
    window.invitationInstallation = null;
    window.dispatchEvent(new Event(EVENEMENT));
  });
}

export async function installer() {
  const invitation = window.invitationInstallation;
  if (!invitation) return false;
  await invitation.prompt();
  const { outcome } = await invitation.userChoice;
  window.invitationInstallation = null;
  return outcome === "accepted";
}

export function refuseeRecemment() {
  try {
    const t = Number(localStorage.getItem(CLE_REFUS) ?? 0);
    return Date.now() - t < UN_MOIS;
  } catch {
    return false;
  }
}

export function refuser() {
  try {
    localStorage.setItem(CLE_REFUS, String(Date.now()));
  } catch {}
}
