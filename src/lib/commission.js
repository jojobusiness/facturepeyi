// Modèle de commission de prescription cabinet.
// Un cabinet (ou tout prescripteur) recommande Factur'Peyi → chaque client recommandé
// qui s'abonne génère une commission RÉCURRENTE de 25 % du prix mensuel de son plan.
// Hook stratégique principal du démarchage cabinets (voir mémoire project-strategie-cabinets).

export const COMMISSION_RATE = 0.25;

// Prix mensuels de liste (€). Cohérents avec Forfaits.jsx.
// L'annuel (2 mois offerts) n'est pas distingué ici : on raisonne en équivalent mensuel
// sur le prix de liste, base d'estimation standard pour un tableau de bord prescripteur.
export const PLAN_MONTHLY_PRICE = {
  decouverte: 0,
  pionnier: 0,   // paiement unique, pas d'abonnement récurrent
  solo: 19.99,
  pro: 34.99,
  expert: 54.99,
  cabinet: 99.99,
};

export function monthlyPrice(plan) {
  return PLAN_MONTHLY_PRICE[plan] ?? 0;
}

/** Commission mensuelle récurrente pour un client abonné à `plan`. */
export function monthlyCommission(plan) {
  return +(monthlyPrice(plan) * COMMISSION_RATE).toFixed(2);
}

/**
 * Agrège la commission sur une liste de filleuls.
 * Seuls les filleuls au statut "active" génèrent une commission récurrente.
 * @returns {{ activeCount: number, monthlyTotal: number, annualTotal: number }}
 */
export function aggregateCommission(referrals) {
  const active = (referrals || []).filter((r) => r.planStatus === "active");
  const monthlyTotal = +active.reduce((sum, r) => sum + monthlyCommission(r.plan), 0).toFixed(2);
  return {
    activeCount: active.length,
    monthlyTotal,
    annualTotal: +(monthlyTotal * 12).toFixed(2),
  };
}
