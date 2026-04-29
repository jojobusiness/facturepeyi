import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";

// ── Firebase Admin (singleton) ─────────────────────────────────────────────
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Factur'Peyi <noreply@facturepeyi.com>";
const REMINDER_THRESHOLDS = [7, 15, 30];

// ── Helpers ───────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatEur(amount) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount ?? 0);
}

function buildReminderHtml(clientNom, montant, numero, joursRetard) {
  const urgency = joursRetard >= 30 ? "#b91c1c" : joursRetard >= 15 ? "#dc2626" : "#ea580c";
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111">
      <div style="margin-bottom:24px">
        <span style="font-size:22px;font-weight:900;color:#059669">Factur'Peyi</span>
      </div>
      <div style="background:#fef2f2;border-left:4px solid ${urgency};border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;font-weight:700;color:${urgency};font-size:15px">
          Rappel J+${joursRetard} — Paiement en attente
        </p>
        <p style="margin:6px 0 0;color:#555;font-size:14px">
          Facture <strong>${esc(numero)}</strong> · <strong>${esc(montant)}</strong>
        </p>
      </div>
      <p style="color:#555;line-height:1.7;margin-bottom:20px">
        Bonjour ${esc(clientNom)},<br/><br/>
        Nous vous rappelons que la facture <strong>${esc(numero)}</strong>
        d'un montant de <strong>${esc(montant)}</strong> est en attente de règlement
        depuis <strong>${joursRetard} jour${joursRetard > 1 ? "s" : ""}</strong>.
      </p>
      <p style="color:#555;line-height:1.7;margin-bottom:24px">
        Si vous avez déjà effectué le paiement, merci d'ignorer ce message.
        Dans le cas contraire, nous vous serions reconnaissants de procéder au règlement dans les meilleurs délais.
      </p>
      <p style="color:#777;font-size:13px;line-height:1.6">
        Pour toute question, n'hésitez pas à nous contacter en répondant à cet email.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px"/>
      <p style="color:#aaa;font-size:12px;margin:0">
        Factur'Peyi · Le logiciel de facturation des DOM-TOM
      </p>
    </div>
  `;
}

// ── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Only GET (Vercel Cron) or POST (manual trigger)
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify Vercel Cron secret (skip check when CRON_SECRET not set — dev mode)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization ?? "";
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const now = Date.now();
  const results = { checked: 0, sent: 0, errors: 0 };

  try {
    const companiesSnap = await db.collection("entreprises").get();

    for (const companyDoc of companiesSnap.docs) {
      const entrepriseId = companyDoc.id;

      const facturesSnap = await db
        .collection("entreprises").doc(entrepriseId)
        .collection("factures")
        .where("status", "in", ["en attente", "en retard"])
        .get();

      for (const factureDoc of facturesSnap.docs) {
        results.checked++;
        const facture = factureDoc.data();

        // Skip if no client email
        if (!facture.clientEmail) continue;

        // Compute days elapsed since invoice date
        const factureDate = facture.date?.toDate?.() ?? new Date(facture.date);
        const daysElapsed = Math.floor((now - factureDate.getTime()) / 86_400_000);

        const remindersSent = facture.remindersSent ?? [];

        // Find the highest threshold that's been crossed but not yet sent
        let thresholdToSend = null;
        for (const threshold of REMINDER_THRESHOLDS) {
          if (daysElapsed >= threshold && !remindersSent.includes(threshold)) {
            thresholdToSend = threshold;
          }
        }
        if (thresholdToSend === null) continue;

        const numero = `FAC-${factureDoc.id.slice(-8).toUpperCase()}`;
        const montant = formatEur(facture.totalTTC);

        try {
          await resend.emails.send({
            from: FROM,
            to: facture.clientEmail,
            subject: `Rappel J+${thresholdToSend} — Facture ${numero} en attente`,
            html: buildReminderHtml(facture.clientNom, montant, numero, daysElapsed),
          });

          // Mark reminder as sent + ensure status is "en retard"
          await factureDoc.ref.update({
            remindersSent: FieldValue.arrayUnion(thresholdToSend),
            status: "en retard",
          });

          results.sent++;
        } catch (err) {
          console.error(`Reminder failed for facture ${factureDoc.id}:`, err.message);
          results.errors++;
        }
      }
    }
  } catch (err) {
    console.error("send-reminders cron error:", err);
    return res.status(500).json({ error: err.message, ...results });
  }

  return res.status(200).json(results);
}
