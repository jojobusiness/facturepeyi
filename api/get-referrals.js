import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();
const auth = getAuth();

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).json({ error: "Non authentifié" });

  try {
    await auth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Token invalide" });
  }

  const { code } = req.query;
  if (!code || code.length < 4) return res.status(400).json({ error: "Code invalide" });

  try {
    const snap = await db.collection("entreprises").where("referredBy", "==", code).get();
    const referrals = snap.docs.map((d) => {
      const data = d.data();
      // Retourne uniquement les champs nécessaires — jamais les données sensibles
      return {
        id: d.id,
        nom: data.nom || null,
        territoire: data.territoire || null,
        planStatus: data.planStatus || null,
        plan: data.plan || null,
        planBilling: data.planBilling || null,
      };
    });
    return res.status(200).json({ referrals });
  } catch (err) {
    console.error("get-referrals error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
