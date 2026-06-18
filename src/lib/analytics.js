// Amplitude — analytics produit (funnel d'activation, rétention).
// Calqué sur EduKarib/lib/amplitude.js : SDK chargé en IMPORT DYNAMIQUE (chunk
// séparé, hors bundle critique) et init APRÈS le 1er rendu pour ne pas plomber le
// LCP. Tout est gardé : aucune fonction ne casse le rendu si le SDK n'est pas là
// (bloqueur, échec réseau, dev local).
//
// Données hébergées en UE (serverZone EU) — sans ça le SDK poste vers l'endpoint
// US et renvoie 400 "Invalid API key" (le compte est sur app.eu.amplitude.com).

// Clé browser publique (comme la config Firebase). Override possible via env Vercel.
export const AMPLITUDE_API_KEY =
  import.meta.env.VITE_AMPLITUDE_API_KEY || "70801e37c57d797fe6fbaf4b555798ca";

let amp = null; // module Amplitude une fois chargé
let started = false;

const whenIdle = (cb) =>
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? window.requestIdleCallback(cb, { timeout: 3000 })
    : setTimeout(cb, 1200);

/** Initialise Amplitude une seule fois, après le rendu (chunk async). PROD only. */
export function initAnalytics() {
  if (started || typeof window === "undefined" || !AMPLITUDE_API_KEY) return;
  if (!import.meta.env.PROD) return; // pas de pollution avec les events de dev local
  started = true;
  whenIdle(async () => {
    try {
      amp = await import("@amplitude/analytics-browser");
      amp.init(AMPLITUDE_API_KEY, {
        serverZone: "EU",
        autocapture: true, // pages vues, clics, formulaires, sessions — zéro code en plus
        defaultTracking: { sessions: true },
      });
    } catch {
      amp = null; /* no-op */
    }
  });
}

/** Event personnalisé. No-op tant que le SDK n'est pas chargé (dev/local). */
export function track(event, props = {}) {
  if (!amp) return;
  try {
    amp.track(event, props);
  } catch {
    /* no-op */
  }
}

/** Associe les events à un utilisateur connecté (uid Firebase) + propriétés. */
export function identifyUser(uid, props = {}) {
  if (!amp || !uid) return;
  try {
    amp.setUserId(uid);
    if (Object.keys(props).length) {
      const id = new amp.Identify();
      Object.entries(props).forEach(([k, v]) => id.set(k, v));
      amp.identify(id);
    }
  } catch {
    /* no-op */
  }
}

export function resetUser() {
  if (!amp) return;
  try {
    amp.reset();
  } catch {
    /* no-op */
  }
}

// Events produit clés du funnel Factur'Peyi (utilise ces constantes, pas des strings libres)
export const EVENTS = {
  SIGNUP_COMPLETED: "Signup Completed",         // compte + entreprise créés
  INVOICE_CREATED: "Invoice Created",           // 1ère valeur produit
  INVOICE_SENT: "Invoice Sent",                 // activation réelle
  QUOTE_CREATED: "Quote Created",
  SUBSCRIPTION_STARTED: "Subscription Started", // conversion payante
  CHECKOUT_STARTED: "Checkout Started",
};
