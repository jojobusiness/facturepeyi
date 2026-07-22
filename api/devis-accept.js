// Acceptation (ou refus) d'un devis par le client, depuis le portail public.
// Le client n'est PAS authentifié : toutes les écritures passent par l'Admin SDK,
// jamais par le navigateur.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { notifyOwner, emailShell } from "../lib-server/notify-owner.js";
import { devisNumero, devisExpiration, escHtml, formatEur, SITE_URL } from "../lib-server/devis.js";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

const FROM = "Factur'Peyi <noreply@facturepeyi.com>";
const DECIDED = ["accepté", "refusé"];

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  const raw = Array.isArray(fwd) ? fwd[0] : String(fwd || "");
  return raw.split(",")[0].trim() || null;
}

async function sendMail({ to, subject, html, replyTo }) {
  if (!process.env.RESEND_API_KEY || !to) return;
  try {
    const body = { from: FROM, to: [to], subject, html };
    if (replyTo) body.reply_to = replyTo;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    // L'email est un accessoire : ne jamais faire échouer une acceptation déjà écrite.
    console.error("devis-accept mail failed:", err.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { token, nom, action = "accept" } = req.body || {};
  if (!token) return res.status(400).json({ error: "token requis" });
  if (!["accept", "refuse"].includes(action)) {
    return res.status(400).json({ error: "action invalide" });
  }

  const nomClean = String(nom || "").trim().slice(0, 80);
  if (action === "accept" && nomClean.length < 2) {
    return res.status(400).json({ error: "nom_requis" });
  }

  const linkDoc = await db.collection("paymentLinks").doc(token).get();
  if (!linkDoc.exists) return res.status(404).json({ error: "Lien invalide ou expiré" });

  const { entrepriseId, devisId, kind } = linkDoc.data();
  if (kind !== "devis" || !devisId) {
    return res.status(400).json({ error: "not_a_devis_link" });
  }

  const devisRef = db
    .collection("entreprises").doc(entrepriseId)
    .collection("devis").doc(devisId);

  let devisData;
  try {
    devisData = await db.runTransaction(async (tx) => {
      const snap = await tx.get(devisRef);
      if (!snap.exists) throw Object.assign(new Error("not_found"), { code: 404 });

      const devis = snap.data();

      if (DECIDED.includes(devis.status)) {
        throw Object.assign(new Error("already_decided"), { code: 409, status: devis.status });
      }
      if (devis.convertedToFacture) {
        throw Object.assign(new Error("already_decided"), { code: 409, status: "accepté" });
      }

      const expiration = devisExpiration(devis);
      if (expiration && expiration.getTime() < Date.now()) {
        tx.update(devisRef, { status: "expiré" });
        throw Object.assign(new Error("expired"), { code: 410 });
      }

      if (action === "accept") {
        tx.update(devisRef, {
          status: "accepté",
          acceptedAt: FieldValue.serverTimestamp(),
          acceptedBy: nomClean,
          acceptedIp: clientIp(req),
          acceptedUserAgent: String(req.headers["user-agent"] || "").slice(0, 300),
        });
      } else {
        tx.update(devisRef, {
          status: "refusé",
          refusedAt: FieldValue.serverTimestamp(),
          refusedBy: nomClean || null,
        });
      }

      return devis;
    });
  } catch (err) {
    if (err.code === 409) return res.status(409).json({ error: "already_decided", status: err.status });
    if (err.code === 410) return res.status(410).json({ error: "expired" });
    if (err.code === 404) return res.status(404).json({ error: "Devis introuvable" });
    console.error("devis-accept transaction error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }

  // ── Notifications (hors transaction, best-effort) ─────────────────────────
  const numero = devisNumero(devisData, devisId);
  const montant = formatEur(devisData.totalTTC);
  const clientNom = nomClean || devisData.clientNom || "Votre client";
  const accepted = action === "accept";

  const entrepriseSnap = await db.collection("entreprises").doc(entrepriseId).get();
  const entrepriseNom = entrepriseSnap.data()?.nom || "votre prestataire";

  notifyOwner(db, entrepriseId, {
    subject: accepted
      ? `✅ ${clientNom} a accepté le devis ${numero} — ${montant}`
      : `Devis ${numero} refusé par ${clientNom}`,
    html: emailShell({
      title: accepted ? "Devis accepté" : "Devis refusé",
      intro: accepted
        ? `<strong>${escHtml(clientNom)}</strong> vient d'accepter en ligne le devis <strong>${escHtml(numero)}</strong> d'un montant de <strong>${escHtml(montant)}</strong>.<br/>L'acceptation est horodatée et conservée avec le devis.`
        : `<strong>${escHtml(clientNom)}</strong> a décliné le devis <strong>${escHtml(numero)}</strong> (${escHtml(montant)}).`,
      ctaLabel: accepted ? "Convertir en facture" : "Voir le devis",
      ctaUrl: `${SITE_URL()}/dashboard/devis`,
      footerNote: accepted
        ? "Prochaine étape : convertir ce devis en facture, ou demander un acompte."
        : "",
    }),
  }).catch(() => {});

  if (accepted && devisData.clientEmail) {
    sendMail({
      to: devisData.clientEmail,
      subject: `Confirmation — vous avez accepté le devis ${numero}`,
      html: emailShell({
        title: "Votre acceptation est enregistrée",
        intro: `Bonjour ${escHtml(clientNom)},<br/>Nous confirmons votre acceptation du devis <strong>${escHtml(numero)}</strong> d'un montant de <strong>${escHtml(montant)}</strong>, proposé par <strong>${escHtml(entrepriseNom)}</strong>.`,
        ctaLabel: "Revoir le devis",
        ctaUrl: `${SITE_URL()}/portail/${token}`,
        footerNote: `${escHtml(entrepriseNom)} va prendre contact avec vous pour la suite.`,
      }),
    });
  }

  return res.status(200).json({
    ok: true,
    status: accepted ? "accepté" : "refusé",
    acceptedBy: accepted ? nomClean : null,
  });
}
