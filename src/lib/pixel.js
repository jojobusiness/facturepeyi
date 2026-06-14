// Chargement du Pixel Meta. Chargé une fois au démarrage de l'app (loadPixel
// est idempotent). Les events (Lead, CompleteRegistration, Purchase) vérifient
// window.fbq avant de tirer, donc ils no-op tant que le pixel n'est pas prêt.

const PIXEL_ID = "902547262470626";

let pixelLoaded = false;

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
