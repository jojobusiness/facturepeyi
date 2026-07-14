# PLAN — Numérotation séquentielle des factures (13/07/2026)

> ✅ **IMPLÉMENTÉ le 14/07/2026** — helper `src/utils/invoiceNumber.js`, branché dans CreateInvoice/CreateAcompte/CreateSolde, règles Firestore `compteurs`, FAQ Support corrigée, mentions B2B (L441-10) ajoutées au footer InvoicePDF. Reste côté Joseph : déployer les Firestore rules + test manuel (2 factures d'affilée) + init du compteur si des factures 2026 existent déjà (voir §6).

## Problème (constaté dans le code le 13/07/2026)

La numérotation actuelle n'est **pas conforme** à l'exigence de séquence chronologique continue (art. 242 nonies A, ann. II CGI) :

- `src/pages/CreateInvoice.jsx:99` → `FAC-${year}-${facRef.id.slice(0, 6).toUpperCase()}` — 6 caractères **aléatoires** de l'ID Firestore.
- `src/pages/CreateAcompte.jsx:55` → même pattern.
- `src/pages/CreateSolde.jsx:50` → même pattern.
- `src/pages/InvoiceList.jsx:175` → fallback avec un format encore différent (`FAC-{8 chars}`).
- `src/pages/Support.jsx:15` → la FAQ affirme « FAC-AAAA-XXX, configurable dans les Paramètres » : **faux**, aucune config n'existe.

Conséquences : numéros uniques mais non séquentiels → non conforme en cas de contrôle, bloquant pour la crédibilité Factur-X/PDP 2026, et la FAQ promet un truc qui n'existe pas.

## Fix — compteur transactionnel Firestore par entreprise et par année

### 1. Nouveau helper `src/utils/invoiceNumber.js`

```js
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../lib/firebase";

// Réserve le prochain numéro séquentiel : FAC-2026-0001, FAC-2026-0002, ...
// Transaction Firestore = pas de doublon même si 2 factures créées en même temps.
export async function reserveInvoiceNumber(entrepriseId, prefix = "FAC") {
  const year = new Date().getFullYear();
  const counterRef = doc(db, "entreprises", entrepriseId, "compteurs", `factures_${year}`);
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? snap.data().next : 1;
    tx.set(counterRef, { next: current + 1 }, { merge: true });
    return current;
  });
  return `${prefix}-${year}-${String(next).padStart(4, "0")}`;
}
```

### 2. Brancher dans les 3 pages de création

Dans `CreateInvoice.jsx`, `CreateAcompte.jsx`, `CreateSolde.jsx`, remplacer la ligne `const numero = \`FAC-...\`` par :

```js
const numero = await reserveInvoiceNumber(entrepriseId);
```

(+ import en haut de fichier). Garder `facRef = doc(collection(...))` tel quel — l'ID du doc ne sert plus au numéro.

⚠️ Acomptes et soldes partagent la MÊME séquence que les factures (exigence légale : une seule séquence chronologique). Ne pas créer de compteur séparé.

### 3. Firestore rules

Autoriser lecture/écriture de `entreprises/{id}/compteurs/{docId}` aux membres de l'entreprise (mêmes règles que `/factures`).

### 4. Fallback InvoiceList.jsx:175

Le fallback `FAC-${invoice.id.slice(0,8)}` ne s'applique qu'aux vieilles factures sans champ `numero` — le laisser, ou afficher `invoice.numero ?? "—"`.

### 5. Support.jsx:15 — corriger la FAQ

Remplacer par la vérité une fois le fix déployé :
> « Oui. La numérotation est automatique et séquentielle (format FAC-AAAA-0001), conforme aux exigences fiscales. »

### 6. Factures existantes

Ne PAS renuméroter les factures déjà émises (interdit). La séquence propre démarre à la prochaine facture. Si des factures 2026 existent déjà, initialiser le compteur `next` au-dessus du nombre de factures 2026 existantes (ex : 12 factures déjà émises → `next: 13`).

## Bonus recommandé (même session, 15 min)

`src/components/InvoicePDF.jsx` — le footer légal (l.87-92) inclut forme juridique, capital, SIRET, TVA, RCS, mention TVA territoriale, mais il **manque les mentions B2B obligatoires** :

> « En cas de retard de paiement : pénalités au taux de 3 fois le taux d'intérêt légal + indemnité forfaitaire de recouvrement de 40 € (art. L441-10 C. com.). Pas d'escompte pour paiement anticipé. »

À ajouter en ligne de footer (dupliquer dans `DevisPDF.jsx` si pertinent). Rend le claim « mentions obligatoires » 100 % vrai.

## Checklist de validation (env de dev Joseph)

1. `npm run build` passe.
2. Créer 2 factures d'affilée → FAC-2026-0001 puis FAC-2026-0002.
3. Créer un acompte → FAC-2026-0003 (même séquence).
4. Vérifier le PDF : numéro + nouvelles mentions au footer.
5. Commit + push + deploy Vercel.

**Deadline conseillée : avant J6 du plan de publication (vidéo FP5 « 3 erreurs ») — pour que « Factur'Peyi gère les trois automatiquement » soit vrai le jour où la vidéo sort.**
