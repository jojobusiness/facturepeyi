import { getAuth } from "firebase-admin/auth";

export async function verifyBearer(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  try {
    return await getAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function verifyAdminOfEntreprise(db, req, entrepriseId) {
  const decoded = await verifyBearer(req);
  if (!decoded) return { ok: false, status: 401, error: "Non authentifié" };
  if (!entrepriseId) return { ok: false, status: 400, error: "entrepriseId requis" };

  const memberSnap = await db
    .collection("entreprises").doc(entrepriseId)
    .collection("membres").doc(decoded.uid)
    .get();

  if (!memberSnap.exists || memberSnap.data()?.role !== "admin") {
    return { ok: false, status: 403, error: "Accès refusé — rôle admin requis" };
  }
  return { ok: true, uid: decoded.uid, decoded };
}

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
