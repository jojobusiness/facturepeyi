// Chargement CONDITIONNEL du Pixel Meta.
// Règle CNIL : aucun traceur publicitaire n'est injecté ni déclenché avant le
// consentement explicite de l'utilisateur. Le script fbevents.js n'est chargé
// qu'après un "Accepter" (pas au chargement de la page).

const PIXEL_ID = "902547262470626";
const STORAGE_KEY = "fp_cookie_consent"; // "granted" | "denied" | null

export function getConsent() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

let pixelLoaded = false;

// Injecte le bootstrap Meta + envoie le 1er PageView. Idempotent.
export function loadPixel() {
  if (typeof window === "undefined" || pixelLoaded) return;
  if (window.fbq) {
    pixelLoaded = true;
    return;
  }
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
  pixelLoaded = true;
}

export function grantConsent() {
  try {
    localStorage.setItem(STORAGE_KEY, "granted");
  } catch {
    /* stockage indisponible : on charge quand même pour la session */
  }
  loadPixel();
}

export function denyConsent() {
  try {
    localStorage.setItem(STORAGE_KEY, "denied");
  } catch {
    /* no-op */
  }
  // Si le pixel a déjà été chargé dans la session (retrait après coup), il faut
  // recharger la page pour réellement le stopper — géré par l'appelant (Cookies.jsx).
}

// À appeler au démarrage de l'app : recharge le pixel si l'utilisateur avait déjà accepté.
export function initConsent() {
  if (getConsent() === "granted") loadPixel();
}
