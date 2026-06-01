// Mapping des price IDs Stripe → plan interne Factur'Peyi
// Source de vérité pour le webhook qui doit savoir quel plan l'utilisateur a après
// upgrade/downgrade via le Stripe Customer Portal.
//
// ⚠️ Synchroniser avec :
//   - src/pages/Forfaits.jsx (constantes SOLO_PRICE_ID, PRO_PRICE_ID, EXPERT_PRICE_ID)
//   - api/stripe-checkout.js (ALLOWED_PRICE_IDS)

export const PRICE_ID_TO_PLAN = {
  // Mensuel
  "price_1TYQZWIck4iMBRE9Ulc07a9u": "solo",
  "price_1TYQbBIck4iMBRE9PeSRBS3R": "pro",
  "price_1TYQcIIck4iMBRE9PMoZ4wZW": "expert",
  // Annuel — 2 mois offerts (à créer dans Stripe, cf TUTO_STRIPE.md)
  "price_1TdcN9Ick4iMBRE9nFos3SwT": "solo",
  "price_1TdcPbIck4iMBRE9J1DFhfSs": "pro",
  "price_1TdcS5Ick4iMBRE9YaEvAwoM": "expert",
  // Cabinet (à créer dans Stripe, cf TUTO_STRIPE.md)
  "price_1TdcnqIck4iMBRE9ciWBYBnz": "cabinet",
  "price_1TdcnqIck4iMBRE9muYieS04": "cabinet",
};

export const PLAN_LABEL = {
  decouverte: "Découverte",
  solo: "Solo",
  pro: "Pro",
  expert: "Expert",
  cabinet: "Cabinet",
};

export const PLAN_PRICE_EUR = {
  decouverte: 0,
  solo: 19.99,
  pro: 34.99,
  expert: 54.99,
  cabinet: 99.99,
};

export function planFromSubscription(sub) {
  const priceId = sub?.items?.data?.[0]?.price?.id;
  return PRICE_ID_TO_PLAN[priceId] || null;
}
