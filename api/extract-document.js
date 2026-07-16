import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import { verifyBearer } from "../lib-server/auth.js";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

// Quota d'extractions IA par mois selon le plan (levier d'upgrade)
const QUOTAS = {
  decouverte: 10,
  solo: 100,
  pionnier: 100,
  pro: 300,
  expert: 1000,
  cabinet: 1000,
};

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_BASE64_LENGTH = 5_600_000; // ~4 Mo de fichier une fois encodé en base64

// Schéma structured outputs : le JSON de sortie est garanti conforme
const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    type_document: {
      type: "string",
      enum: ["facture_emise", "depense", "devis", "inconnu"],
      description: "facture_emise si l'entreprise de l'utilisateur est l'émettrice ; depense si elle est destinataire ; devis si le document est un devis/proposition",
    },
    numero: { type: ["string", "null"], description: "Numéro du document tel qu'écrit" },
    date: { type: ["string", "null"], description: "Date d'émission au format AAAA-MM-JJ" },
    emetteur: { type: "string", description: "Nom de l'émetteur du document" },
    destinataire: { type: "string", description: "Nom du destinataire" },
    description: { type: "string", description: "Résumé de la prestation/produits en une ligne" },
    montant_ht: { type: ["number", "null"] },
    taux_tva: { type: ["number", "null"], description: "Taux de TVA en pourcentage (ex: 8.5), null si absent" },
    montant_ttc: { type: "number" },
    statut: { type: ["string", "null"], enum: ["payée", "en attente", null], description: "Si le document indique un paiement reçu/acquitté" },
    confiance: { type: "string", enum: ["haute", "moyenne", "basse"] },
  },
  required: [
    "type_document", "numero", "date", "emetteur", "destinataire",
    "description", "montant_ht", "taux_tva", "montant_ttc", "statut", "confiance",
  ],
  additionalProperties: false,
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(503).json({ error: "Import IA non configuré (clé API manquante)." });
  }

  const decoded = await verifyBearer(req);
  if (!decoded) return res.status(401).json({ error: "Non authentifié" });

  const { mediaType, data } = req.body || {};
  if (!ALLOWED_TYPES.includes(mediaType)) {
    return res.status(400).json({ error: "Format non supporté (PDF, JPG, PNG ou WebP)." });
  }
  if (!data || typeof data !== "string" || data.length > MAX_BASE64_LENGTH) {
    return res.status(400).json({ error: "Fichier manquant ou trop lourd (4 Mo max)." });
  }

  try {
    // Entreprise de l'utilisateur (pour le tri émetteur/destinataire + plan)
    const userSnap = await db.collection("utilisateurs").doc(decoded.uid).get();
    const entrepriseId = userSnap.data()?.entrepriseId;
    if (!entrepriseId) return res.status(403).json({ error: "Entreprise introuvable." });

    const entSnap = await db.collection("entreprises").doc(entrepriseId).get();
    const entreprise = entSnap.data() || {};
    const quota = QUOTAS[entreprise.plan] ?? QUOTAS.decouverte;

    // Quota mensuel — transaction (même pattern que la numérotation séquentielle)
    const now = new Date();
    const monthKey = `extractions_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const counterRef = db.collection("entreprises").doc(entrepriseId)
      .collection("compteurs").doc(monthKey);
    const allowed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(counterRef);
      const used = snap.exists ? (snap.data().count || 0) : 0;
      if (used >= quota) return false;
      tx.set(counterRef, { count: used + 1 }, { merge: true });
      return true;
    });
    if (!allowed) {
      return res.status(429).json({
        error: `Quota mensuel atteint (${quota} documents sur votre plan). Passez au plan supérieur pour continuer.`,
        quotaReached: true,
      });
    }

    const client = new Anthropic({ apiKey });
    const contentBlock = mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data } };

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      output_config: { format: { type: "json_schema", schema: EXTRACTION_SCHEMA } },
      messages: [{
        role: "user",
        content: [
          contentBlock,
          {
            type: "text",
            text: `Analyse ce document comptable. L'entreprise de l'utilisateur est « ${entreprise.nom || "inconnue"} »${entreprise.siret ? ` (SIRET ${entreprise.siret})` : ""}.
Règles de classification :
- Si cette entreprise est l'ÉMETTRICE du document et que c'est une facture → type_document = "facture_emise".
- Si cette entreprise est la DESTINATAIRE (elle achète/paie) → type_document = "depense".
- Si le document est un devis, une proposition ou un bon de commande non facturé → type_document = "devis".
- Si le document n'est pas un document comptable lisible → type_document = "inconnu" et confiance = "basse".
Montants : lis les montants tels qu'écrits (format français possible : 1 234,56 €). Si seul le TTC est présent, montant_ht = null.
confiance = "basse" si le document est flou, partiel ou ambigu.`,
          },
        ],
      }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (response.stop_reason === "refusal" || !textBlock) {
      return res.status(422).json({ error: "Document illisible ou analyse refusée." });
    }

    return res.status(200).json({ extraction: JSON.parse(textBlock.text) });
  } catch (err) {
    console.error("extract-document:", err?.status, err?.message);
    if (err?.status === 429) {
      return res.status(503).json({ error: "Service momentanément saturé, réessayez dans une minute." });
    }
    return res.status(500).json({ error: "Erreur lors de l'analyse du document." });
  }
}
