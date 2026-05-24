// Cron quotidien : envoie des emails de conversion aux entreprises en essai gratuit
// Schedule : tous les jours à 9h UTC (cf vercel.json)
//
// Logique :
//   Pour chaque entreprise en planStatus === "trial" :
//     Calcule jours restants avant trialEndsAt
//     Si jours restants ∈ [15, 7, 3, 1] et email pas encore envoyé :
//       Envoie l'email correspondant via Resend
//       Marque le seuil dans entreprises.trialEmailsSent (arrayUnion)

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logSysadmin } from "../lib-server/sysadmin-log.js";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

const FROM = "Factur'Peyi <noreply@facturepeyi.com>";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://facturepeyi.com").trim().replace(/\/$/, "");
const TRIAL_THRESHOLDS = [15, 7, 3, 1];

// ─── Templates emails (urgence croissante) ───────────────────────────────────

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function tplJ15({ nom, daysLeft, factures, clients }) {
  return {
    subject: "Vous êtes à mi-parcours de votre essai Factur'Peyi",
    html: shell({
      title: `Plus que ${daysLeft} jours, ${esc(nom)} 👋`,
      intro: `Vous avez créé <strong>${factures} facture${factures > 1 ? "s" : ""}</strong> et géré <strong>${clients} client${clients > 1 ? "s" : ""}</strong> avec Factur'Peyi.<br/><br/>Vous êtes à mi-chemin de votre essai gratuit. Pour continuer à profiter de la facturation illimitée, des rappels automatiques et de la déclaration fiscale DOM-TOM, choisissez votre formule dès maintenant.`,
      ctaLabel: "Voir les formules",
      ctaUrl: `${SITE_URL}/Forfaits`,
      footerNote: "Vous pouvez basculer en plan Découverte gratuit à tout moment si vous préférez.",
    }),
  };
}

function tplJ7({ nom, daysLeft }) {
  return {
    subject: `Plus qu'une semaine d'essai gratuit, ${esc(nom)}`,
    html: shell({
      title: `${daysLeft} jours avant la fin de votre essai`,
      intro: `Votre essai gratuit Factur'Peyi se termine dans <strong>${daysLeft} jour${daysLeft > 1 ? "s" : ""}</strong>.<br/><br/>Sans formule active, vous repassez automatiquement en plan Découverte (5 factures max, fonctionnalités limitées). Pour garder tout ce que vous avez construit — factures illimitées, rappels automatiques J+7/15/30, portail client de paiement, déclaration fiscale DOM-TOM — choisissez votre formule dès maintenant.`,
      ctaLabel: "Choisir ma formule",
      ctaUrl: `${SITE_URL}/Forfaits`,
      footerNote: "Solo à 19,99 €/mois, Pro à 34,99 €/mois. Résiliable à tout moment, sans engagement.",
    }),
  };
}

function tplJ3({ nom, daysLeft }) {
  return {
    subject: `⏰ Plus que ${daysLeft} jour${daysLeft > 1 ? "s" : ""} — sécurisez votre compte ${esc(nom)}`,
    html: shell({
      title: `Encore ${daysLeft} jour${daysLeft > 1 ? "s" : ""} avant la fin de votre essai`,
      intro: `Pour ne perdre aucun accès, choisissez votre formule maintenant. <strong>Solo à 19,99 €/mois</strong> couvre 95 % des indépendants des DOM-TOM : factures illimitées, devis, rappels automatiques, déclaration fiscale.<br/><br/>Vous pouvez upgrader vers Pro ou Expert plus tard en 1 clic depuis votre espace.`,
      ctaLabel: "Activer Solo (19,99 €/mois)",
      ctaUrl: `${SITE_URL}/Forfaits`,
      footerNote: "Aucun engagement, résiliable à tout moment depuis votre dashboard.",
    }),
  };
}

function tplJ1({ nom }) {
  return {
    subject: `🚨 Dernier jour, ${nom} — votre essai expire demain`,
    html: shell({
      title: "Votre essai gratuit expire demain",
      intro: `Demain, votre compte bascule automatiquement en plan Découverte gratuit (5 factures max, sans rappels automatiques, sans portail client).<br/><br/>Si vous facturez plus de 5 fois par mois, ou si vous voulez continuer à utiliser les rappels et la déclaration fiscale DOM-TOM, choisissez votre formule MAINTENANT en moins de 2 minutes.`,
      ctaLabel: "Choisir ma formule maintenant",
      ctaUrl: `${SITE_URL}/Forfaits`,
      footerNote: "Si vous décidez de ne pas continuer, votre compte reste accessible en plan Découverte (vous gardez vos données).",
    }),
  };
}

function shell({ title, intro, ctaLabel, ctaUrl, footerNote }) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111">
      <div style="margin-bottom:24px">
        <span style="font-size:22px;font-weight:900;color:#059669">Factur'Peyi</span>
      </div>
      <h2 style="color:#0d1b3e;margin:0 0 12px;font-size:22px;line-height:1.3">${title}</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 24px">${intro}</p>
      <p style="margin:24px 0">
        <a href="${ctaUrl}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px">${ctaLabel}</a>
      </p>
      <p style="color:#777;font-size:13px;line-height:1.6;margin-top:20px">${footerNote}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px"/>
      <p style="color:#aaa;font-size:12px;margin:0">
        Factur'Peyi · Le logiciel de facturation des DOM-TOM<br/>
        Vous recevez cet email car vous êtes en essai gratuit. Pour vous désinscrire, contactez <a href="mailto:contact@facturepeyi.com" style="color:#10b981">contact@facturepeyi.com</a>.
      </p>
    </div>
  `;
}

const TEMPLATE_BY_THRESHOLD = {
  15: tplJ15,
  7: tplJ7,
  3: tplJ3,
  1: tplJ1,
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ error: "CRON_SECRET non configuré" });
    }
  } else {
    const authHeader = req.headers.authorization ?? "";
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const now = Date.now();
  const dayMs = 86_400_000;
  const results = { checked: 0, sent: 0, skipped: 0, errors: 0 };

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "RESEND_API_KEY non configurée" });
  }

  try {
    const snap = await db.collection("entreprises")
      .where("planStatus", "==", "trial")
      .get();

    for (const entrepriseDoc of snap.docs) {
      results.checked++;
      const entreprise = entrepriseDoc.data();

      // Skip suspended / soft-deleted
      if (entreprise.suspended === true || entreprise.deletedAt) {
        results.skipped++;
        continue;
      }

      const trialEnd = entreprise.trialEndsAt?.toDate?.()?.getTime?.();
      if (!trialEnd) { results.skipped++; continue; }

      const msLeft = trialEnd - now;
      const daysLeft = Math.ceil(msLeft / dayMs);
      // Si plus dans la fenêtre d'envoi (négatif ou > 15)
      if (daysLeft < 0 || daysLeft > 15) { results.skipped++; continue; }

      // Trouve le seuil correspondant (le plus élevé ≤ daysLeft pas encore envoyé)
      const sent = Array.isArray(entreprise.trialEmailsSent) ? entreprise.trialEmailsSent : [];
      const candidate = TRIAL_THRESHOLDS.find((t) => daysLeft <= t && !sent.includes(t));
      if (!candidate) { results.skipped++; continue; }

      // Récupère l'email du propriétaire
      const ownerUid = entreprise.ownerUid;
      if (!ownerUid) { results.skipped++; continue; }
      const ownerSnap = await db.collection("utilisateurs").doc(ownerUid).get();
      const ownerEmail = ownerSnap.data()?.email;
      const ownerNom = ownerSnap.data()?.nom || entreprise.nom || "";
      if (!ownerEmail) { results.skipped++; continue; }

      // Compteurs basiques (pour J-15)
      let factures = 0, clients = 0;
      if (candidate === 15) {
        const [factSnap, cliSnap] = await Promise.all([
          db.collection("entreprises").doc(entrepriseDoc.id).collection("factures").get(),
          db.collection("entreprises").doc(entrepriseDoc.id).collection("clients").get(),
        ]);
        factures = factSnap.size;
        clients = cliSnap.size;
      }

      const tpl = TEMPLATE_BY_THRESHOLD[candidate];
      const { subject, html } = tpl({ nom: ownerNom, daysLeft, factures, clients });

      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          },
          body: JSON.stringify({ from: FROM, to: [ownerEmail], subject, html }),
        });
        if (!r.ok) {
          const body = await r.text().catch(() => "");
          throw new Error(`Resend ${r.status}: ${body.slice(0, 200)}`);
        }
        await entrepriseDoc.ref.update({
          trialEmailsSent: FieldValue.arrayUnion(candidate),
        });
        results.sent++;
      } catch (err) {
        console.error(`Trial email failed for ${entrepriseDoc.id}:`, err.message);
        results.errors++;
      }
    }
  } catch (err) {
    console.error("send-trial-emails cron error:", err);
    logSysadmin(db, {
      severity: "critical",
      source: "cron-send-trial-emails",
      message: err.message,
      meta: results,
    }).catch(() => {});
    return res.status(500).json({ error: err.message, ...results });
  }

  return res.status(200).json(results);
}
