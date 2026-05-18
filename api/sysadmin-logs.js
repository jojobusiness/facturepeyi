import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();
const adminAuth = getAuth();

async function verifySuperAdmin(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userSnap = await db.collection("utilisateurs").doc(decoded.uid).get();
    if (userSnap.data()?.superAdmin !== true) return null;
    return decoded.uid;
  } catch (err) {
    console.error("verifySuperAdmin error:", err.message);
    return null;
  }
}

function mapDocs(snap) {
  return snap.docs.map((d) => {
    const data = d.data();
    let createdAtIso = null;
    try {
      createdAtIso = data.createdAt?.toDate?.()?.toISOString?.() ?? null;
    } catch { /* noop */ }
    return {
      id: d.id,
      severity: data.severity || "info",
      source: data.source || "unknown",
      message: data.message || "",
      meta: data.meta ?? null,
      createdAtIso,
    };
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const uid = await verifySuperAdmin(req);
  if (!uid) return res.status(403).json({ error: "Forbidden" });

  // Tentative 1 : query avec orderBy createdAt desc + limit 100
  try {
    const snap = await db
      .collection("sysadmin_logs")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
    return res.status(200).json({ logs: mapDocs(snap) });
  } catch (err) {
    console.error("sysadmin-logs orderBy failed:", err.message, err.code);

    // Tentative 2 : fallback sans orderBy (collection vide / sans createdAt / besoin d'index)
    try {
      const snap = await db.collection("sysadmin_logs").limit(100).get();
      const logs = mapDocs(snap);
      // Tri client-side
      logs.sort((a, b) => (b.createdAtIso || "").localeCompare(a.createdAtIso || ""));
      return res.status(200).json({
        logs,
        fallbackUsed: true,
        warning: err.message,
      });
    } catch (err2) {
      console.error("sysadmin-logs fallback also failed:", err2.message, err2.code);
      // Dernier recours : retourner vide + détails pour debug côté front
      return res.status(200).json({
        logs: [],
        debug: {
          stage: "all-queries-failed",
          firstError: err.message,
          firstCode: err.code,
          secondError: err2.message,
          secondCode: err2.code,
        },
      });
    }
  }
}
