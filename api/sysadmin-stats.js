import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();
const adminAuth = getAuth();

const PLAN_PRICE = {
  decouverte: 0,
  solo: 19.99,
  pro: 34.99,
  expert: 54.99,
  cabinet: 99.99,
};

async function verifySuperAdmin(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userSnap = await db.collection("utilisateurs").doc(decoded.uid).get();
    if (userSnap.data()?.superAdmin !== true) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const uid = await verifySuperAdmin(req);
  if (!uid) return res.status(403).json({ error: "Forbidden" });

  try {
    const now = Date.now();
    const dayMs = 86_400_000;

    const entreprisesSnap = await db.collection("entreprises").get();
    const entreprises = entreprisesSnap.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt?.toDate?.()?.getTime?.() || 0;
      return {
        id: d.id,
        nom: data.nom || "—",
        ownerUid: data.ownerUid || null,
        plan: data.plan || "decouverte",
        planStatus: data.planStatus || "trial",
        territoire: data.territoire || "—",
        stripeCustomerId: data.stripeCustomerId || null,
        stripeConnectedAccountId: data.stripeConnectedAccountId || null,
        suspended: data.suspended === true,
        deletedAt: data.deletedAt?.toDate?.()?.toISOString?.() || null,
        createdAt,
        createdAtIso: data.createdAt?.toDate?.()?.toISOString?.() || null,
      };
    });

    const active = entreprises.filter((e) => !e.deletedAt && !e.suspended);
    const paying = active.filter((e) => e.plan && e.plan !== "decouverte" && e.planStatus === "active");

    const mrr = paying.reduce((sum, e) => sum + (PLAN_PRICE[e.plan] || 0), 0);

    const signups30d = entreprises.filter(
      (e) => e.createdAt && e.createdAt > now - 30 * dayMs
    ).length;

    const trials = active.filter((e) => e.planStatus === "trial").length;
    const canceledLast30 = entreprises.filter(
      (e) => e.planStatus === "canceled" && e.createdAt && e.createdAt > now - 30 * dayMs
    ).length;

    const stripeConnected = active.filter((e) => e.stripeConnectedAccountId).length;

    // Calcul commissions cumulées (somme des application_fee_amount sur les factures payées via portail)
    // Parallélisation pour éviter timeout 10s sur lambda Vercel quand nb d'entreprises grandit.
    const factureSnaps = await Promise.all(
      active.map((ent) =>
        db.collection("entreprises").doc(ent.id)
          .collection("factures").where("status", "==", "payée").get()
      )
    );
    let commissionsTotalCents = 0;
    for (const snap of factureSnaps) {
      for (const f of snap.docs) {
        const fee = f.data().applicationFeeAmount;
        if (typeof fee === "number") commissionsTotalCents += fee;
      }
    }

    return res.status(200).json({
      kpis: {
        mrr,
        signups30d,
        entreprisesActives: active.length,
        trials,
        canceledLast30,
        stripeConnected,
        commissionsTotal: commissionsTotalCents / 100,
        totalEntreprises: entreprises.length,
      },
      entreprises: entreprises.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    });
  } catch (err) {
    console.error("sysadmin-stats error:", err);
    return res.status(500).json({ error: err.message });
  }
}
