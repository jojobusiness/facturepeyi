import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logSysadmin } from "../lib-server/sysadmin-log.js";
import { planFromSubscription, PLAN_LABEL } from "../lib-server/stripe-plans.js";
import { notifyOwner, emailShell } from "../lib-server/notify-owner.js";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Vercel — ne pas parser le body (besoin du buffer brut pour la signature Stripe)
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function findEntrepriseByCustomerId(customerId) {
  const snap = await db.collection("entreprises")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0];
}

function priceRank(plan) {
  return { decouverte: 0, solo: 1, pro: 2, expert: 3, cabinet: 4 }[plan] ?? -1;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET non configuré");
    return res.status(500).json({ error: "Configuration serveur incomplète" });
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    logSysadmin(db, { severity: "error", source: "webhook-stripe", message: `Signature invalide: ${err.message}` }).catch(() => {});
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.metadata?.type !== "invoice_payment") break;

        const { entrepriseId, factureId } = session.metadata;
        if (!entrepriseId || !factureId) break;

        const factureRef = db.collection("entreprises").doc(entrepriseId).collection("factures").doc(factureId);
        const factureSnap = await factureRef.get();
        if (!factureSnap.exists) break;

        await factureRef.update({ status: "payée", paidAt: FieldValue.serverTimestamp() });

        // Notification email au propriétaire (fire-and-forget)
        const entrepriseSnap = await db.collection("entreprises").doc(entrepriseId).get();
        const entrepriseData = entrepriseSnap.data();
        if (entrepriseData?.ownerUid && process.env.RESEND_API_KEY) {
          db.collection("utilisateurs").doc(entrepriseData.ownerUid).get().then((ownerSnap) => {
            const ownerEmail = ownerSnap.data()?.email;
            const facture = factureSnap.data();
            if (!ownerEmail) return;
            fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: "Factur'Peyi <noreply@facturepeyi.com>",
                to: [ownerEmail],
                subject: `Paiement reçu — ${facture.clientNom} — ${facture.totalTTC?.toFixed(2)} €`,
                html: `<p>Bonjour,</p><p>Le paiement de <strong>${facture.totalTTC?.toFixed(2)} €</strong> de la part de <strong>${facture.clientNom}</strong> a bien été reçu via le portail client.</p><p>La facture a été automatiquement marquée comme payée dans <strong>Factur'Peyi</strong>.</p>`,
              }),
            }).catch(() => {});
          }).catch(() => {});
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const doc = await findEntrepriseByCustomerId(sub.customer);
        if (!doc) break;

        const status = sub.status === "active" ? "active"
          : sub.status === "past_due" ? "past_due"
          : sub.status === "canceled" ? "canceled"
          : sub.status;

        const oldPlan = doc.data().plan;
        const newPlan = planFromSubscription(sub);

        const update = {
          planStatus: status,
          stripeSubscriptionId: sub.id,
          cancelAtPeriodEnd: sub.cancel_at_period_end === true,
          currentPeriodEnd: sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : null,
        };
        if (newPlan && newPlan !== oldPlan) update.plan = newPlan;

        await doc.ref.update(update);

        // Notification : changement de plan (upgrade/downgrade)
        if (newPlan && oldPlan && newPlan !== oldPlan) {
          const direction = priceRank(newPlan) > priceRank(oldPlan) ? "upgrade" : "downgrade";
          notifyOwner(db, doc.id, {
            subject: `Plan modifié : ${PLAN_LABEL[oldPlan] || oldPlan} → ${PLAN_LABEL[newPlan] || newPlan}`,
            html: emailShell({
              title: direction === "upgrade" ? "Bienvenue dans votre nouveau plan" : "Changement de plan confirmé",
              intro: `Votre abonnement Factur'Peyi est passé de <strong>${PLAN_LABEL[oldPlan] || oldPlan}</strong> à <strong>${PLAN_LABEL[newPlan] || newPlan}</strong>. Les nouvelles fonctionnalités sont disponibles immédiatement.`,
              ctaLabel: "Voir mon abonnement",
              ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/mon-abonnement`,
              footerNote: "Le prorata est appliqué automatiquement par Stripe sur votre prochaine facture.",
            }),
          }).catch(() => {});
        }

        // Notification : annulation programmée
        if (sub.cancel_at_period_end === true && doc.data().cancelAtPeriodEnd !== true) {
          const endDate = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toLocaleDateString("fr-FR")
            : null;
          notifyOwner(db, doc.id, {
            subject: "Annulation de votre abonnement Factur'Peyi confirmée",
            html: emailShell({
              title: "Annulation programmée",
              intro: `Votre demande d'annulation a bien été enregistrée. Vous gardez l'accès complet à votre plan jusqu'au <strong>${endDate || "terme de la période en cours"}</strong>. Après cette date, votre compte basculera automatiquement en plan gratuit Découverte.`,
              ctaLabel: "Réactiver mon abonnement",
              ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/mon-abonnement`,
              footerNote: "Vous pouvez annuler la résiliation à tout moment avant la date d'expiration.",
            }),
          }).catch(() => {});
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const doc = await findEntrepriseByCustomerId(sub.customer);
        if (!doc) break;
        // Repasser au plan gratuit
        await doc.ref.update({
          plan: "decouverte",
          planStatus: "canceled",
          stripeSubscriptionId: null,
          cancelAtPeriodEnd: false,
        });
        notifyOwner(db, doc.id, {
          subject: "Votre abonnement Factur'Peyi a pris fin",
          html: emailShell({
            title: "Fin d'abonnement",
            intro: "Votre abonnement payant a pris fin. Votre compte est désormais en plan gratuit Découverte (5 factures max). Vos données restent accessibles.",
            ctaLabel: "Reprendre un abonnement",
            ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/Forfaits`,
          }),
        }).catch(() => {});
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const doc = await findEntrepriseByCustomerId(invoice.customer);
        if (!doc) break;
        await doc.ref.update({ planStatus: "past_due" });
        notifyOwner(db, doc.id, {
          subject: "Échec du prélèvement de votre abonnement Factur'Peyi",
          html: emailShell({
            title: "Paiement en échec",
            intro: `Le prélèvement de votre abonnement n'a pas pu aboutir (montant <strong>${(invoice.amount_due / 100).toFixed(2)} €</strong>). Pour éviter la suspension de votre compte, merci de mettre à jour vos informations de paiement.`,
            ctaLabel: "Mettre à jour ma carte",
            ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/mon-abonnement`,
            footerNote: "Stripe retentera automatiquement le prélèvement plusieurs fois avant suspension.",
          }),
        }).catch(() => {});
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        if (invoice.billing_reason === "subscription_cycle") {
          const doc = await findEntrepriseByCustomerId(invoice.customer);
          if (doc) await doc.ref.update({ planStatus: "active" });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    logSysadmin(db, {
      severity: "critical",
      source: "webhook-stripe",
      message: `Erreur de traitement: ${err.message}`,
      meta: { eventType: event?.type, eventId: event?.id },
    }).catch(() => {});
  }

  return res.status(200).json({ received: true });
}
