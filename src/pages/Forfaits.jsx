import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaArrowLeft } from "react-icons/fa";

const SOLO_PRICE_ID = "price_1Rlat8Ick4iMBRE91vyvhOFc";
const PRO_PRICE_ID = "price_1RlatdIck4iMBRE9fWyZausA";
// const EXPERT_PRICE_ID = "price_TODO";

const plans = [
  {
    id: "decouverte",
    name: "Découverte",
    tagline: "Testez sans engagement",
    price: null,
    priceLabel: "Gratuit",
    period: "30 jours",
    features: [
      "Toutes les fonctionnalités incluses",
      "Jusqu'à 5 factures",
      "Gestion des dépenses",
      "Comptabilité de base",
      "Sans carte bancaire",
    ],
    cta: "Commencer gratuitement",
    highlight: false,
    trial: true,
  },
  {
    id: "solo",
    name: "Solo",
    tagline: "Pour les indépendants",
    price: SOLO_PRICE_ID,
    priceLabel: "19,99€",
    period: "/mois",
    features: [
      "Factures illimitées",
      "Devis & rappels de paiement",
      "Gestion des dépenses",
      "Export PDF / Excel",
      "1 utilisateur",
      "Support email",
    ],
    cta: "Choisir Solo",
    highlight: false,
    trial: false,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Pour les entreprises qui grandissent",
    price: PRO_PRICE_ID,
    priceLabel: "34,99€",
    period: "/mois",
    features: [
      "Tout Solo inclus",
      "Multi-utilisateurs (admin, comptable, employé)",
      "Factures récurrentes automatiques",
      "Portail client + paiement en ligne",
      "Gestion des acomptes",
      "Support prioritaire",
    ],
    cta: "Choisir Pro",
    highlight: true,
    trial: false,
  },
  {
    id: "expert",
    name: "Expert",
    tagline: "Pour les PME et artisans avancés",
    price: null,
    priceLabel: "54,99€",
    period: "/mois",
    features: [
      "Tout Pro inclus",
      "Import bancaire (CSV/OFX)",
      "Multi-projets / chantiers",
      "Rapports avancés",
      "Support dédié",
    ],
    cta: "Bientôt disponible",
    highlight: false,
    trial: false,
    comingSoon: true,
  },
];

export default function Forfaits() {
  const [loading, setLoading] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";

  const handleStripeCheckout = async (priceId, planId) => {
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location = data.url;
      } else {
        alert("Erreur lors de la redirection vers le paiement.");
        setLoading("");
      }
    } catch {
      alert("Erreur lors de la connexion au serveur de paiement.");
      setLoading("");
    }
  };

  const handleTrial = () => {
    navigate("/Inscription", { state: { trialOk: true, ref: refCode || null } });
  };

  const handlePlanClick = (plan) => {
    if (plan.comingSoon || loading) return;
    if (plan.trial) {
      handleTrial();
    } else if (plan.price) {
      handleStripeCheckout(plan.price, plan.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-700 transition mb-6">
          <FaArrowLeft className="w-3 h-3" /> Retour à l'accueil
        </Link>
        <div className="text-center">
          <span className="text-emerald-700 font-semibold text-sm uppercase tracking-wider">Tarifs</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">
            Choisissez votre formule
          </h1>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Commencez gratuitement. Aucune carte bancaire requise pour l'essai. Annulable à tout moment.
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`relative rounded-2xl flex flex-col p-6 transition ${
              plan.highlight
                ? "bg-emerald-700 text-white shadow-2xl shadow-emerald-200 ring-2 ring-emerald-600"
                : "bg-white border border-gray-100 shadow-sm"
            } ${plan.comingSoon ? "opacity-60" : ""}`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                Le plus populaire
              </div>
            )}

            <div className={`text-sm font-semibold mb-1 ${plan.highlight ? "text-emerald-200" : "text-emerald-700"}`}>
              {plan.name}
            </div>
            <div className={`text-xs mb-3 ${plan.highlight ? "text-emerald-300" : "text-gray-400"}`}>
              {plan.tagline}
            </div>

            <div className="flex items-baseline gap-1 mb-4">
              <span className={`text-3xl font-extrabold ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                {plan.priceLabel}
              </span>
              <span className={`text-sm ${plan.highlight ? "text-emerald-300" : "text-gray-400"}`}>
                {plan.period}
              </span>
            </div>

            <ul className={`space-y-2 flex-1 mb-6 text-sm ${plan.highlight ? "text-emerald-100" : "text-gray-600"}`}>
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2">
                  <FaCheckCircle className={`flex-shrink-0 mt-0.5 ${plan.highlight ? "text-yellow-400" : "text-emerald-600"}`} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              disabled={!!loading || plan.comingSoon}
              onClick={() => handlePlanClick(plan)}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition disabled:cursor-not-allowed ${
                plan.comingSoon
                  ? "bg-gray-100 text-gray-400 border border-gray-200"
                  : plan.highlight
                    ? "bg-yellow-400 hover:bg-yellow-300 text-gray-900"
                    : plan.trial
                      ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                      : "border border-emerald-700 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {loading === plan.id ? "Redirection..." : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Note fiscale */}
      <div className="max-w-5xl mx-auto bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-sm text-emerald-800">
        <strong>TVA DOM-TOM incluse :</strong> Guyane & Mayotte à 0% · Martinique, Guadeloupe & Réunion à 8,5% · Octroi de mer géré · Mentions légales automatiques sur chaque facture.
      </div>

      {/* Lien connexion */}
      <p className="text-center text-sm text-gray-400 mt-8">
        Déjà un compte ?{" "}
        <Link to="/login" className="text-emerald-700 font-semibold hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
