import { doc, runTransaction } from "firebase/firestore";
import { db } from "../lib/firebase";

// Crée une facture avec le prochain numéro séquentiel : FAC-2026-0001, FAC-2026-0002, ...
// Le compteur ET l'écriture de la facture sont dans la MÊME transaction Firestore :
// pas de doublon en cas de créations simultanées, et pas de trou de séquence si
// l'écriture échoue (exigence légale : séquence chronologique continue —
// art. 242 nonies A, ann. II CGI).
// Factures, acomptes et soldes partagent la même séquence (compteur unique par année).
// `withTransaction(tx)` optionnel : écritures supplémentaires à commiter atomiquement.
export async function createNumberedInvoice(entrepriseId, facRef, data, { prefix = "FAC", withTransaction } = {}) {
  const year = new Date().getFullYear();
  const counterRef = doc(db, "entreprises", entrepriseId, "compteurs", `factures_${year}`);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? snap.data().next : 1;
    const numero = `${prefix}-${year}-${String(current).padStart(4, "0")}`;
    tx.set(counterRef, { next: current + 1 }, { merge: true });
    tx.set(facRef, { ...data, numero });
    if (withTransaction) withTransaction(tx);
    return numero;
  });
}
