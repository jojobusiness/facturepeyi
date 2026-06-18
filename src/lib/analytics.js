// Amplitude — analytics produit (funnel d'activation, rétention)
// Clé browser publique (comme la config Firebase) — exposée côté client, c'est normal.
// Données hébergées en UE (serverZone EU) pour rester conforme RGPD/CNIL.
import * as amplitude from "@amplitude/analytics-browser";

// Clé browser publique Amplitude (compte EU)
const AMPLITUDE_API_KEY = "70801e37c57d797fe6fbaf4b555798ca";

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (!AMPLITUDE_API_KEY || AMPLITUDE_API_KEY.endsWith("...")) {
    console.warn("[analytics] Clé Amplitude manquante — tracking désactivé.");
    return;
  }
  amplitude.init(AMPLITUDE_API_KEY, {
    serverZone: "EU", // données hébergées en Union Européenne (RGPD)
    autocapture: {
      pageViews: true,
      sessions: true,
      formInteractions: false,
      fileDownloads: false,
      elementInteractions: false,
    },
  });
  initialized = true;
}

// Identifie l'utilisateur connecté (à appeler après login / au chargement de la session)
export function identifyUser(uid, props = {}) {
  if (!initialized) return;
  amplitude.setUserId(uid);
  if (Object.keys(props).length) {
    const id = new amplitude.Identify();
    Object.entries(props).forEach(([k, v]) => id.set(k, v));
    amplitude.identify(id);
  }
}

export function resetUser() {
  if (!initialized) return;
  amplitude.reset();
}

// Helper générique
export function track(event, props = {}) {
  if (!initialized) return;
  amplitude.track(event, props);
}

// Events produit clés du funnel Factur'Peyi (utilise ces constantes, pas des strings libres)
export const EVENTS = {
  SIGNUP_COMPLETED: "Signup Completed",        // compte + entreprise créés
  INVOICE_CREATED: "Invoice Created",          // 1ère valeur produit
  INVOICE_SENT: "Invoice Sent",                // activation réelle
  QUOTE_CREATED: "Quote Created",
  SUBSCRIPTION_STARTED: "Subscription Started",// conversion payante
  CHECKOUT_STARTED: "Checkout Started",
};
