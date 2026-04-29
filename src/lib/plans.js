// Définitions des plans et limites d'abonnement

export const PLANS = {
  decouverte: {
    id: "decouverte",
    name: "Découverte",
    badge: "Essai",
    badgeColor: "bg-gray-100 text-gray-600",
    maxFactures: 5,
    maxUsers: 1,
    features: ["factures", "devis", "clients", "depenses", "categories", "declaration", "calendrier"],
  },
  solo: {
    id: "solo",
    name: "Solo",
    badge: "Solo",
    badgeColor: "bg-blue-100 text-blue-700",
    maxFactures: Infinity,
    maxUsers: 1,
    features: ["factures", "devis", "clients", "depenses", "categories", "declaration", "calendrier", "rappels", "rapports"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    badge: "Pro",
    badgeColor: "bg-emerald-100 text-emerald-700",
    maxFactures: Infinity,
    maxUsers: Infinity,
    features: ["factures", "devis", "clients", "depenses", "categories", "declaration", "calendrier", "rappels", "rapports", "multi-users", "recurrence"],
  },
  expert: {
    id: "expert",
    name: "Expert",
    badge: "Expert",
    badgeColor: "bg-purple-100 text-purple-700",
    maxFactures: Infinity,
    maxUsers: Infinity,
    features: ["factures", "devis", "clients", "depenses", "categories", "declaration", "calendrier", "rappels", "rapports", "multi-users", "recurrence", "import-bancaire"],
  },
};

export function getPlan(planId) {
  return PLANS[planId] || PLANS.decouverte;
}

export function canUseFeature(planId, feature) {
  return getPlan(planId).features.includes(feature);
}

export function isTrialExpired(entreprise) {
  if (entreprise?.planStatus !== "trial") return false;
  if (!entreprise?.trialEndsAt) return false;
  const ends = entreprise.trialEndsAt?.toDate?.() ?? new Date(entreprise.trialEndsAt);
  return new Date() > ends;
}

export function getPlanStatus(entreprise) {
  if (!entreprise) return "inactive";
  if (isTrialExpired(entreprise)) return "expired";
  return entreprise.planStatus || "trial";
}

// Retourne { allowed: boolean, reason: string, upgradeRequired: string|null }
export function checkFacturesLimit(planId, currentCount) {
  const limit = getPlan(planId).maxFactures;
  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `Vous avez atteint la limite de ${limit} facture${limit > 1 ? "s" : ""} du plan ${getPlan(planId).name}.`,
      upgradeRequired: "solo",
    };
  }
  return { allowed: true };
}

export function checkUsersLimit(planId, currentCount) {
  const limit = getPlan(planId).maxUsers;
  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `Le plan ${getPlan(planId).name} est limité à ${limit} utilisateur${limit > 1 ? "s" : ""}.`,
      upgradeRequired: "pro",
    };
  }
  return { allowed: true };
}
