import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

function nextDate(date, frequence) {
  const d = new Date(date);
  if (frequence === "monthly")   d.setMonth(d.getMonth() + 1);
  if (frequence === "quarterly") d.setMonth(d.getMonth() + 3);
  if (frequence === "yearly")    d.setFullYear(d.getFullYear() + 1);
  return d;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization ?? "";
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const now = new Date();
  const results = { checked: 0, generated: 0, errors: 0 };

  try {
    const companiesSnap = await db.collection("entreprises").get();

    for (const companyDoc of companiesSnap.docs) {
      const entrepriseId = companyDoc.id;

      const recSnap = await db
        .collection("entreprises").doc(entrepriseId)
        .collection("recurrences")
        .where("active", "==", true)
        .get();

      for (const recDoc of recSnap.docs) {
        results.checked++;
        const rec = recDoc.data();

        const nextTs = rec.nextDate?.toDate?.() ?? new Date(rec.nextDate);
        if (nextTs > now) continue;

        try {
          const ht  = rec.amountHT;
          const tva = parseFloat((ht * (rec.tvaRate / 100)).toFixed(2));
          const ttc = parseFloat((ht + tva).toFixed(2));

          await db
            .collection("entreprises").doc(entrepriseId)
            .collection("factures")
            .add({
              clientId:      rec.clientId,
              clientNom:     rec.clientNom,
              clientEmail:   rec.clientEmail,
              description:   rec.description,
              amountHT:      ht,
              tva,
              totalTTC:      ttc,
              tvaRate:       rec.tvaRate,
              mentionLegale: rec.mentionLegale || "",
              date:          Timestamp.fromDate(now),
              status:        "en attente",
              createdAt:     Timestamp.fromDate(now),
              entrepriseId,
              recurrenceId:  recDoc.id,
            });

          const newNext = nextDate(nextTs, rec.frequence);
          await recDoc.ref.update({
            nextDate:        Timestamp.fromDate(newNext),
            lastGeneratedAt: Timestamp.fromDate(now),
          });

          results.generated++;
        } catch (err) {
          console.error(`Recurrence error ${recDoc.id}:`, err.message);
          results.errors++;
        }
      }
    }
  } catch (err) {
    console.error("generate-recurrences error:", err);
    return res.status(500).json({ error: err.message, ...results });
  }

  return res.status(200).json(results);
}
