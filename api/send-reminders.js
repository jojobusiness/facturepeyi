import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";
import { logSysadmin } from "../lib-server/sysadmin-log.js";
import { devisNumero, devisExpiration, SITE_URL } from "../lib-server/devis.js";

// ── Firebase Admin (singleton) ─────────────────────────────────────────────
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Factur'Peyi <noreply@facturepeyi.com>";
const REMINDER_THRESHOLDS = [7, 15, 30];

// Devis : relances douces après l'envoi, + un rappel avant l'expiration.
const DEVIS_THRESHOLDS = [3, 7];
const PRE_EXPIRATION_KEY = "pre-exp";
const PRE_EXPIRATION_DAYS = 2;

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

/**
 * Relance de devis — volontairement différente d'une relance d'impayé :
 * ton neutre, pas de rouge, pas de "J+7". On rappelle une échéance, on n'insiste pas.
 */
function buildDevisRelanceHtml({ clientNom, numero, montant, entrepriseNom, lien, expirationStr, preExpiration }) {
  const intro = preExpiration
    ? `Petit rappel : le devis <strong>${esc(numero)}</strong> d'un montant de <strong>${esc(montant)}</strong>
       arrive à échéance${expirationStr ? ` le <strong>${esc(expirationStr)}</strong>` : ""}.`
    : `Je reviens vers vous concernant le devis <strong>${esc(numero)}</strong>
       d'un montant de <strong>${esc(montant)}</strong>${expirationStr ? `, valable jusqu'au <strong>${esc(expirationStr)}</strong>` : ""}.`;

  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111">
      <div style="margin-bottom:24px">
        <span style="font-size:22px;font-weight:900;color:#059669">Factur'Peyi</span>
      </div>
      <p style="color:#555;line-height:1.7;margin-bottom:20px">
        Bonjour ${esc(clientNom)},<br/><br/>
        ${intro}
      </p>
      <p style="color:#555;line-height:1.7;margin-bottom:24px">
        Avez-vous des questions ou souhaitez-vous des ajustements ?
        Répondez simplement à cet email, ${esc(entrepriseNom || "nous")} reste disponible.
      </p>
      ${lien ? `
      <a href="${esc(lien)}"
         style="display:inline-block;background:#059669;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px">
        Voir et accepter le devis
      </a>` : ""}
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px"/>
      <p style="color:#aaa;font-size:12px;margin:0">
        Factur'Peyi · Le logiciel de facturation des DOM-TOM
      </p>
    </div>
  `;
}

/** Relances de devis + passage automatique en "expiré", pour une entreprise. */
async function processDevis(entrepriseId, entreprise, now, results) {
  // Interrupteur par entreprise (défaut : actif)
  if (entreprise?.relancesDevisActives === false) return;

  const devisSnap = await db
    .collection("entreprises").doc(entrepriseId)
    .collection("devis")
    .where("status", "==", "envoyé")
    .get();

  for (const devisDoc of devisSnap.docs) {
    results.devisChecked++;
    const devis = devisDoc.data();

    if (devis.convertedToFacture) continue;

    const expiration = devisExpiration(devis);

    // 1. Devis périmé → on le marque et on ne relance jamais dessus.
    if (expiration && expiration.getTime() < now) {
      try {
        await devisDoc.ref.update({ status: "expiré" });
        results.devisExpires++;
      } catch (err) {
        console.error(`Expiration devis ${devisDoc.id}:`, err.message);
        results.errors++;
      }
      continue;
    }

    if (!devis.clientEmail) continue;

    const sentAt = devis.lastSentAt?.toDate?.() ?? null;
    if (!sentAt) continue; // jamais envoyé par email → rien à relancer

    const relances = devis.relancesSent ?? [];

    // 2. Rappel avant expiration (prioritaire : c'est une échéance réelle).
    let type = null;
    if (expiration) {
      const joursRestants = Math.ceil((expiration.getTime() - now) / 86_400_000);
      if (joursRestants <= PRE_EXPIRATION_DAYS && !relances.includes(PRE_EXPIRATION_KEY)) {
        type = PRE_EXPIRATION_KEY;
      }
    }

    // 3. Sinon relance J+3 / J+7 — même logique anti-saut de palier que les factures.
    if (type == null) {
      const joursEcoules = Math.floor((now - sentAt.getTime()) / 86_400_000);
      type = DEVIS_THRESHOLDS.find((t) => joursEcoules >= t && !relances.includes(t)) ?? null;
    }
    if (type == null) continue;

    const numero = devisNumero(devis, devisDoc.id);
    const montant = formatEur(devis.totalTTC);
    const lien = devis.devisToken ? `${SITE_URL()}/portail/${devis.devisToken}` : null;
    const preExpiration = type === PRE_EXPIRATION_KEY;

    try {
      const payload = {
        from: FROM,
        to: devis.clientEmail,
        subject: preExpiration
          ? `Votre devis ${numero} arrive à échéance`
          : `Devis ${numero} — avez-vous eu le temps d'y jeter un œil ?`,
        html: buildDevisRelanceHtml({
          clientNom: devis.clientNom || "",
          numero,
          montant,
          entrepriseNom: entreprise?.nom || "",
          lien,
          expirationStr: expiration ? expiration.toLocaleDateString("fr-FR") : "",
          preExpiration,
        }),
      };
      if (entreprise?.emailContact) payload.replyTo = entreprise.emailContact;

      await resend.emails.send(payload);
      await devisDoc.ref.update({
        relancesSent: FieldValue.arrayUnion(type),
        lastRelanceAt: FieldValue.serverTimestamp(),
      });
      results.devisRelances++;
    } catch (err) {
      console.error(`Relance devis ${devisDoc.id}:`, err.message);
      results.errors++;
    }
  }
}

// ── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Only GET (Vercel Cron) or POST (manual trigger)
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ error: "CRON_SECRET non configuré en production" });
    }
  } else {
    const authHeader = req.headers.authorization ?? "";
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const now = Date.now();
  const results = { checked: 0, sent: 0, errors: 0, devisChecked: 0, devisRelances: 0, devisExpires: 0 };

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

        // Find the SMALLEST threshold crossed but not yet sent (avoids skipping J+7
        // if cron failed on that day and we're now at J+16 — we still send J+7 first).
        const thresholdToSend = REMINDER_THRESHOLDS.find(
          (t) => daysElapsed >= t && !remindersSent.includes(t)
        );
        if (thresholdToSend == null) continue;

        const numero = facture.numero || `FAC-${factureDoc.id.slice(-8).toUpperCase()}`;
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

      // ── Devis : relances + expiration ──
      try {
        await processDevis(entrepriseId, companyDoc.data(), now, results);
      } catch (err) {
        console.error(`processDevis ${entrepriseId}:`, err.message);
        results.errors++;
      }
    }
  } catch (err) {
    console.error("send-reminders cron error:", err);
    logSysadmin(db, {
      severity: "critical",
      source: "cron-send-reminders",
      message: err.message,
      meta: results,
    }).catch(() => {});
    return res.status(500).json({ error: err.message, ...results });
  }

  return res.status(200).json(results);
}
