// Helpers partagés entre les routes serveur qui manipulent des devis.

/** Numéro affiché d'un devis — même convention que DevisList.jsx côté front. */
export function devisNumero(devis, devisId) {
  return devis?.numero || `DEV-${String(devisId).slice(0, 8).toUpperCase()}`;
}

/** Date d'expiration d'un devis (dateExpiration, avec repli sur dateValidite). */
export function devisExpiration(devis) {
  const ts = devis?.dateExpiration || devis?.dateValidite;
  if (!ts) return null;
  const d = ts?.toDate?.() ?? new Date(ts);
  return isNaN(d) ? null : d;
}

export function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function formatEur(amount) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount ?? 0);
}

export const SITE_URL = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "https://facturepeyi.com").trim().replace(/\/$/, "");
