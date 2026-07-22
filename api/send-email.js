import { Resend } from "resend";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const adminAuth = getAuth();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Factur'Peyi <noreply@facturepeyi.com>";

const INTERNAL_TYPES = ["welcome", "payment_received"];
const CLIENT_TYPES = ["invoice_sent", "payment_reminder", "devis_sent"];
const ALL_TYPES = [...INTERNAL_TYPES, ...CLIENT_TYPES];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 Mo de PDF, large

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const templates = {
  welcome: ({ nom, entreprise }) => ({
    subject: `Bienvenue sur Factur'Peyi, ${esc(nom)} !`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111">
        <div style="margin-bottom:24px">
          <span style="font-size:22px;font-weight:900;color:#059669">Factur'Peyi</span>
        </div>
        <h1 style="font-size:24px;font-weight:700;color:#0d1b3e;margin-bottom:8px">
          Bienvenue, ${esc(nom)} !
        </h1>
        <p style="color:#555;line-height:1.6;margin-bottom:16px">
          Votre compte <strong>${esc(entreprise)}</strong> est prêt. Vous pouvez dès maintenant
          créer vos premières factures avec la fiscalité DOM-TOM déjà configurée.
        </p>
        <a href="https://facturepeyi.com/dashboard"
           style="display:inline-block;background:#059669;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px">
          Accéder à mon tableau de bord
        </a>
        <p style="color:#aaa;font-size:12px;margin-top:32px">
          Factur'Peyi · Le logiciel de facturation des DOM-TOM
        </p>
      </div>
    `,
  }),

  invoice_sent: ({ clientNom, montant, numeroFacture, lienFacture, entrepriseNom, messagePerso }) => ({
    subject: `Facture ${esc(numeroFacture)} de ${esc(entrepriseNom || "votre prestataire")} — ${esc(montant)}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111">
        <div style="margin-bottom:24px">
          <span style="font-size:22px;font-weight:900;color:#059669">Factur'Peyi</span>
        </div>
        <h1 style="font-size:22px;font-weight:700;color:#0d1b3e;margin-bottom:8px">
          Facture ${esc(numeroFacture)}
        </h1>
        <p style="color:#555;line-height:1.6;margin-bottom:16px">
          Bonjour ${esc(clientNom)},<br/>
          Veuillez trouver ci-joint votre facture d'un montant de <strong>${esc(montant)}</strong>${entrepriseNom ? ` émise par <strong>${esc(entrepriseNom)}</strong>` : ""}.
        </p>
        ${messagePerso ? `<p style="color:#444;line-height:1.6;margin:16px 0;padding:12px 16px;background:#f9fafb;border-left:3px solid #059669;border-radius:4px">${esc(messagePerso)}</p>` : ""}
        ${lienFacture ? `
        <a href="${esc(lienFacture)}"
           style="display:inline-block;background:#059669;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px">
          Payer la facture en ligne
        </a>
        <p style="color:#777;font-size:13px;margin-top:12px">Paiement sécurisé par carte bancaire.</p>` : ""}
        <p style="color:#aaa;font-size:12px;margin-top:32px">
          Email envoyé via Factur'Peyi · facturepeyi.com
        </p>
      </div>
    `,
  }),

  devis_sent: ({ clientNom, montant, numeroDevis, lienDevis, entrepriseNom, validite, messagePerso }) => ({
    subject: `Devis ${esc(numeroDevis)} de ${esc(entrepriseNom || "votre prestataire")} — ${esc(montant)}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111">
        <div style="margin-bottom:24px">
          <span style="font-size:22px;font-weight:900;color:#059669">Factur'Peyi</span>
        </div>
        <h1 style="font-size:22px;font-weight:700;color:#0d1b3e;margin-bottom:8px">
          Devis ${esc(numeroDevis)}
        </h1>
        <p style="color:#555;line-height:1.6;margin-bottom:16px">
          Bonjour ${esc(clientNom)},<br/>
          Veuillez trouver ci-joint le devis ${entrepriseNom ? `proposé par <strong>${esc(entrepriseNom)}</strong>` : ""} d'un montant de <strong>${esc(montant)}</strong>${validite ? `, valable jusqu'au <strong>${esc(validite)}</strong>` : ""}.
        </p>
        ${messagePerso ? `<p style="color:#444;line-height:1.6;margin:16px 0;padding:12px 16px;background:#f9fafb;border-left:3px solid #059669;border-radius:4px">${esc(messagePerso)}</p>` : ""}
        ${lienDevis ? `
        <a href="${esc(lienDevis)}"
           style="display:inline-block;background:#059669;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px">
          Voir et accepter le devis
        </a>
        <p style="color:#777;font-size:13px;margin-top:12px">Vous pouvez accepter ce devis en ligne, en un clic.</p>` : ""}
        <p style="color:#aaa;font-size:12px;margin-top:32px">
          Email envoyé via Factur'Peyi · facturepeyi.com
        </p>
      </div>
    `,
  }),

  payment_reminder: ({ clientNom, montant, numeroFacture, joursRetard, lienFacture }) => ({
    subject: `Rappel : facture ${esc(numeroFacture)} en attente de règlement`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111">
        <div style="margin-bottom:24px">
          <span style="font-size:22px;font-weight:900;color:#059669">Factur'Peyi</span>
        </div>
        <h1 style="font-size:22px;font-weight:700;color:#0d1b3e;margin-bottom:8px">
          Rappel de paiement
        </h1>
        <p style="color:#555;line-height:1.6;margin-bottom:16px">
          Bonjour ${esc(clientNom)},<br/>
          Notre facture <strong>${esc(numeroFacture)}</strong> d'un montant de <strong>${esc(montant)}</strong>
          est en attente de règlement depuis ${esc(String(joursRetard))} jour${joursRetard > 1 ? "s" : ""}.
        </p>
        ${lienFacture ? `
        <a href="${esc(lienFacture)}"
           style="display:inline-block;background:#dc2626;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px">
          Régler maintenant
        </a>` : ""}
        <p style="color:#aaa;font-size:12px;margin-top:32px">
          Factur'Peyi · Le logiciel de facturation des DOM-TOM
        </p>
      </div>
    `,
  }),

  payment_received: ({ clientNom, montant, numeroFacture }) => ({
    subject: `Paiement reçu — ${esc(numeroFacture)}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111">
        <div style="margin-bottom:24px">
          <span style="font-size:22px;font-weight:900;color:#059669">Factur'Peyi</span>
        </div>
        <div style="background:#f0fdf4;border-left:4px solid #059669;border-radius:8px;padding:16px;margin-bottom:20px">
          <p style="margin:0;font-weight:700;color:#059669;font-size:16px">✓ Paiement reçu</p>
          <p style="margin:4px 0 0;color:#555;font-size:14px">${esc(montant)} de ${esc(clientNom)} — Facture ${esc(numeroFacture)}</p>
        </div>
        <p style="color:#555;line-height:1.6">
          Le paiement a bien été enregistré. Votre facture est maintenant marquée comme payée.
        </p>
        <a href="https://facturepeyi.com/dashboard"
           style="display:inline-block;background:#059669;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;margin-top:16px">
          Voir mon tableau de bord
        </a>
        <p style="color:#aaa;font-size:12px;margin-top:32px">
          Factur'Peyi · Le logiciel de facturation des DOM-TOM
        </p>
      </div>
    `,
  }),
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).json({ error: "Non authentifié" });

  try {
    await adminAuth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Token invalide" });
  }

  const { type, to, data, attachments, replyTo } = req.body;

  if (!type || !to || !ALL_TYPES.includes(type)) {
    return res.status(400).json({ error: "type, to, and valid template required" });
  }

  if (!EMAIL_RE.test(to)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  let cleanedAttachments;
  if (Array.isArray(attachments) && attachments.length) {
    cleanedAttachments = [];
    for (const att of attachments) {
      if (!att?.filename || !att?.content) continue;
      const approxBytes = Math.floor((att.content.length * 3) / 4);
      if (approxBytes > MAX_ATTACHMENT_BYTES) {
        return res.status(413).json({ error: "Pièce jointe trop volumineuse (max 8 Mo)" });
      }
      cleanedAttachments.push({
        filename: String(att.filename).slice(0, 120),
        content: String(att.content),
      });
    }
    if (cleanedAttachments.length === 0) cleanedAttachments = undefined;
  }

  let cleanedReplyTo;
  if (replyTo && EMAIL_RE.test(replyTo)) cleanedReplyTo = replyTo;

  const { subject, html } = templates[type](data || {});

  try {
    const payload = { from: FROM, to, subject, html };
    if (cleanedAttachments) payload.attachments = cleanedAttachments;
    if (cleanedReplyTo) payload.replyTo = cleanedReplyTo;
    const result = await resend.emails.send(payload);
    return res.status(200).json({ success: true, id: result.id });
  } catch (err) {
    console.error("Resend error:", err);
    return res.status(500).json({ error: "Email send failed" });
  }
}
