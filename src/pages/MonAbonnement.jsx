import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { getPlan } from "../lib/plans";
import {
  FaCreditCard, FaCheckCircle, FaExclamationTriangle,
  FaBan, FaArrowRight, FaExternalLinkAlt, FaCrown,
} from "react-icons/fa";

const PLAN_PRICE = {
  decouverte: { label: "Découverte", price: "Gratuit", period: "30 jours d'essai" },
  solo: { label: "Solo", price: "19,99 €", period: "/ mois" },
  pro: { label: "Pro", price: "34,99 €", period: "/ mois" },
  expert: { label: "Expert", price: "54,99 €", period: "/ mois" },
  cabinet: { label: "Cabinet", price: "99,99 €", period: "/ mois" },
};

const STATUS_INFO = {
  trial: { label: "Essai gratuit", color: "amber", desc: "Profitez de toutes les fonctionnalités pendant 30 jours." },
  active: { label: "Actif", color: "emerald", desc: "Votre abonnement est en cours et fonctionne normalement." },
  past_due: { label: "Paiement en échec", color: "red", desc: "Mettez à jour votre carte pour éviter la suspension." },
  canceled: { label: "Annulé", color: "gray", desc: "Votre abonnement a été annulé." },
};

function formatDate(d) {
  if (!d) return "—";
  try {
    const date = d?.toDate?.() ?? new Date(d);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch { return "—"; }
}

export default function MonAbonnement() {
  const { user, entreprise, loading } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  if (loading || !entreprise) {
    return <div className="text-gray-400">Chargement…</div>;
  }

  const planKey = entreprise.plan || "decouverte";
  const plan = getPlan(planKey);
  const planMeta = PLAN_PRICE[planKey] || PLAN_PRICE.decouverte;
  const statusInfo = STATUS_INFO[entreprise.planStatus] || STATUS_INFO.trial;
  const isOwner = entreprise.ownerUid === user?.uid;
  const cancelScheduled = entreprise.cancelAtPeriodEnd === true;
  const periodEnd = entreprise.currentPeriodEnd;
  const trialEnd = entreprise.trialEndsAt;

  const handlePortal = async () => {
    setPortalLoading(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/stripe-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Impossible d'ouvrir le portail.");
        setPortalLoading(false);
      }
    } catch (err) {
      setError(err.message || "Erreur réseau");
      setPortalLoading(false);
    }
  };

  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mon abonnement</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gérez votre formule, votre moyen de paiement et consultez vos factures.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
          <FaExclamationTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Carte principale du plan */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${plan.badgeColor}`}>
                  {plan.badge}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colorClasses[statusInfo.color]}`}>
                  {statusInfo.label}
                </span>
                {cancelScheduled && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                    Annulation programmée
                  </span>
                )}
              </div>
              <div className="text-3xl font-extrabold text-gray-900 flex items-baseline gap-2">
                Plan {planMeta.label}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-emerald-700">{planMeta.price}</span>
                <span className="text-sm text-gray-500">{planMeta.period}</span>
              </div>
            </div>
            <FaCrown className={`w-12 h-12 ${planKey === "decouverte" ? "text-gray-200" : "text-yellow-400"}`} />
          </div>

          <div className="text-sm text-gray-600 leading-relaxed">{statusInfo.desc}</div>

          {/* Échéances */}
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {entreprise.planStatus === "trial" && trialEnd && (
              <InfoRow label="Fin de l'essai" value={formatDate(trialEnd)} icon="📅" />
            )}
            {periodEnd && entreprise.planStatus !== "trial" && (
              <InfoRow
                label={cancelScheduled ? "Accès jusqu'au" : "Prochain renouvellement"}
                value={formatDate(periodEnd)}
                icon="📅"
              />
            )}
            {entreprise.stripeCustomerId && (
              <InfoRow label="ID client Stripe" value={entreprise.stripeCustomerId} icon="💳" mono />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 sm:px-8 py-5 border-t border-gray-100 flex flex-wrap gap-3">
          {isOwner ? (
            <>
              {entreprise.stripeCustomerId ? (
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-sm"
                >
                  <FaCreditCard className="w-4 h-4" />
                  {portalLoading ? "Redirection…" : "Gérer mon abonnement"}
                  <FaExternalLinkAlt className="w-3 h-3" />
                </button>
              ) : (
                <Link
                  to="/Forfaits"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-sm"
                >
                  Choisir un plan payant
                  <FaArrowRight className="w-3 h-3" />
                </Link>
              )}
              <Link
                to="/Forfaits"
                className="inline-flex items-center gap-2 border border-gray-200 hover:border-gray-300 hover:bg-white text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition"
              >
                Comparer les plans
              </Link>
            </>
          ) : (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <FaBan className="w-3.5 h-3.5" />
              Seul le propriétaire du compte peut gérer l'abonnement.
            </div>
          )}
        </div>
      </div>

      {/* Bandeau Stripe */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-600 leading-relaxed">
        <div className="flex items-start gap-3">
          <FaCheckCircle className="text-emerald-600 w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-gray-800 mb-1">Gestion sécurisée par Stripe</div>
            Le bouton « Gérer mon abonnement » ouvre votre portail client Stripe sécurisé. Vous y trouverez :
            <ul className="mt-2 ml-4 space-y-1 list-disc text-gray-500">
              <li>Changement de plan (upgrade/downgrade) avec prorata automatique</li>
              <li>Annulation de l'abonnement à la fin de la période en cours</li>
              <li>Mise à jour de votre moyen de paiement</li>
              <li>Téléchargement de vos reçus Stripe</li>
            </ul>
            <div className="mt-3 text-xs text-gray-400">
              Vos factures Factur'Peyi officielles seront disponibles prochainement directement depuis cette page.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon, mono }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">{label}</div>
      <div className={`text-sm font-semibold text-gray-800 ${mono ? "font-mono text-xs" : ""} break-all`}>
        <span className="mr-1.5">{icon}</span>
        {value}
      </div>
    </div>
  );
}
