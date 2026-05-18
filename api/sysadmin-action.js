import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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
  if (req.method !== "POST") return res.status(405).end();

  const adminUid = await verifySuperAdmin(req);
  if (!adminUid) return res.status(403).json({ error: "Forbidden" });

  const { action, entrepriseId, reason } = req.body || {};
  if (!action || !entrepriseId) {
    return res.status(400).json({ error: "action et entrepriseId requis" });
  }
  if (!["suspend", "unsuspend", "soft-delete", "restore"].includes(action)) {
    return res.status(400).json({ error: "action invalide" });
  }

  try {
    const ref = db.collection("entreprises").doc(entrepriseId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Entreprise introuvable" });

    const audit = {
      action,
      reason: reason || null,
      byUid: adminUid,
      at: FieldValue.serverTimestamp(),
    };

    if (action === "suspend") {
      await ref.update({
        suspended: true,
        suspendedAt: FieldValue.serverTimestamp(),
        suspendedReason: reason || null,
      });
    } else if (action === "unsuspend") {
      await ref.update({
        suspended: false,
        suspendedAt: FieldValue.delete(),
        suspendedReason: FieldValue.delete(),
      });
    } else if (action === "soft-delete") {
      await ref.update({
        deletedAt: FieldValue.serverTimestamp(),
        deletedReason: reason || null,
        suspended: true,
      });
    } else if (action === "restore") {
      await ref.update({
        deletedAt: FieldValue.delete(),
        deletedReason: FieldValue.delete(),
        suspended: false,
      });
    }

    await db.collection("sysadmin_audit").add({
      ...audit,
      entrepriseId,
    });

    return res.status(200).json({ ok: true, action });
  } catch (err) {
    console.error("sysadmin-action error:", err);
    return res.status(500).json({ error: err.message });
  }
}
