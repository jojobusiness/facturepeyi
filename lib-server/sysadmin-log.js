// Helper côté serveur (API routes) pour logger les erreurs dans `sysadmin_logs`
// et notifier le super-admin par email si severity === "critical".
//
// Usage dans une API route :
//   import { logSysadmin } from "../lib-server/sysadmin-log.js";
//   await logSysadmin(db, { severity: "error", source: "webhook-stripe", message: err.message, meta: {...} });
//
// Le helper est défensif : il ne throw jamais (loguer une erreur ne doit pas casser l'endpoint qui l'appelle).

const SUPER_ADMIN_EMAIL = "facturepeyi@gmail.com";

export async function logSysadmin(db, { severity = "info", source = "unknown", message = "", meta = null } = {}) {
  try {
    await db.collection("sysadmin_logs").add({
      severity,
      source,
      message: String(message).slice(0, 2000),
      meta: meta ?? null,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("logSysadmin write failed:", err.message);
  }

  // Email push sur erreurs critiques uniquement (évite le spam)
  if (severity === "critical" && process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Factur'Peyi <noreply@facturepeyi.com>",
          to: [SUPER_ADMIN_EMAIL],
          subject: `[CRITICAL] ${source} — ${String(message).slice(0, 100)}`,
          html: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
              <h2 style="color:#dc2626;margin-bottom:8px">Erreur critique Factur'Peyi</h2>
              <p style="color:#555"><strong>Source:</strong> ${escapeHtml(source)}</p>
              <p style="color:#555"><strong>Message:</strong></p>
              <pre style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:13px;white-space:pre-wrap;word-break:break-word">${escapeHtml(message)}</pre>
              ${meta ? `<p style="color:#555;margin-top:16px"><strong>Meta:</strong></p><pre style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:12px;white-space:pre-wrap;word-break:break-word">${escapeHtml(JSON.stringify(meta, null, 2))}</pre>` : ""}
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0 12px"/>
              <p style="color:#aaa;font-size:12px;margin:0">Voir tous les logs sur <a href="https://facturepeyi.com/sysadmin" style="color:#10b981">facturepeyi.com/sysadmin</a></p>
            </div>
          `,
        }),
      });
    } catch (err) {
      console.error("logSysadmin email push failed:", err.message);
    }
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
