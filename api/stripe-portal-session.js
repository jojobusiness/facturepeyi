import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();
const adminAuth = getAuth();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function verifyUser(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  try {
    return await adminAuth.verifyIdToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const decoded = await verifyUser(req);
  if (!decoded) return res.status(401).json({ error: "Non authentifié" });

  try {
    const userSnap = await db.collection("utilisateurs").doc(decoded.uid).get();
    const entrepriseId = userSnap.data()?.entrepriseId;
    if (!entrepriseId) return res.status(400).json({ error: "Aucune entreprise associée" });

    const entrepriseSnap = await db.collection("entreprises").doc(entrepriseId).get();
    const entreprise = entrepriseSnap.data();
    if (!entreprise) return res.status(404).json({ error: "Entreprise introuvable" });

    // Vérifier que l'utilisateur est bien le propriétaire (seul lui gère l'abonnement)
    if (entreprise.ownerUid !== decoded.uid) {
      return res.status(403).json({ error: "Seul le propriétaire peut gérer l'abonnement" });
    }

    const customerId = entreprise.stripeCustomerId;
    if (!customerId) {
      return res.status(400).json({
        error: "Aucun abonnement payant actif. Souscrivez à une formule d'abord.",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/mon-abonnement`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("stripe-portal-session error:", err);
    return res.status(500).json({ error: err.message });
  }
}
