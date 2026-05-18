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
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const uid = await verifySuperAdmin(req);
  if (!uid) return res.status(403).json({ error: "Forbidden" });

  try {
    const snap = await db
      .collection("sysadmin_logs")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const logs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        severity: data.severity || "info",
        source: data.source || "unknown",
        message: data.message || "",
        meta: data.meta || null,
        createdAtIso: data.createdAt?.toDate?.()?.toISOString?.() || null,
      };
    });

    return res.status(200).json({ logs });
  } catch (err) {
    if (err.code === 9 || /requires an index/i.test(err.message || "")) {
      return res.status(200).json({ logs: [], indexHint: err.message });
    }
    console.error("sysadmin-logs error:", err);
    return res.status(500).json({ error: err.message });
  }
}
