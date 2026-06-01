import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaArrowLeft, FaCrown, FaBolt, FaBuilding } from "react-icons/fa";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

// --- Mensuel (live) ---
const SOLO_PRICE_ID = "price_1TYQZWIck4iMBRE9Ulc07a9u";
const PRO_PRICE_ID = "price_1TYQbBIck4iMBRE9PeSRBS3R";
const EXPERT_PRICE_ID = "price_1TYQcIIck4iMBRE9PMoZ4wZW";

// --- Annuel : 2 mois offerts (à créer dans Stripe, cf TUTO_STRIPE.md) ---
const SOLO_ANNUAL_PRICE_ID = "price_1TdcN9Ick4iMBRE9nFos3SwT";
const PRO_ANNUAL_PRICE_ID = "price_1TdcPbIck4iMBRE9J1DFhfSs";
const EXPERT_ANNUAL_PRICE_ID = "price_1TdcS5Ick4iMBRE9YaEvAwoM";

// --- Pionnier : paiement unique 199€, accès Solo à vie, 10 places ---
const PIONNIER_PRICE_ID = "price_1TdcJZIck4iMBRE9KizjlK9I";
const PIONNIER_CAP = 10;

// --- Cabinet : experts-comptables, entreprises illimitées (à créer dans Stripe) ---
const CABINET_PRICE_ID = "price_1TdcnqIck4iMBRE9ciWBYBnz";        // 99,99€/mois
const CABINET_ANNUAL_PRICE_ID = "price_1TdcnqIck4iMBRE9muYieS04";  // 999€/an (2 mois offerts)

const plans = [
  {
    id: "decouverte",
    name: "Découverte",
    tagline: "Testez sans engagement",
    priceMonthly: null,
    priceAnnual: null,
    priceLabelMonthly: "Gratuit",
    priceLabelAnnual: "Gratuit",
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
    priceMonthly: SOLO_PRICE_ID,
    priceAnnual: SOLO_ANNUAL_PRICE_ID,
    priceLabelMonthly: "19,99€",
    priceLabelAnnual: "199€",
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
    priceMonthly: PRO_PRICE_ID,
    priceAnnual: PRO_ANNUAL_PRICE_ID,
    priceLabelMonthly: "34,99€",
    priceLabelAnnual: "349€",
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
    priceMonthly: EXPERT_PRICE_ID,
    priceAnnual: EXPERT_ANNUAL_PRICE_ID,
    priceLabelMonthly: "54,99€",
    priceLabelAnnual: "549€",
    features: [
      "Tout Pro inclus",
      "Import bancaire (CSV/OFX)",
      "Multi-projets / chantiers",
      "Rapports avancés",
      "Support dédié",
    ],
    cta: "Choisir Expert",
    highlight: false,
    trial: false,
  },
];

export default function Forfaits() {
  const [loading, setLoading] = useState("");
  const [billing, setBilling] = useState("monthly"); // "monthly" | "annual"
  const [placesLeft, setPlacesLeft] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const isAnnual = billing === "annual";

  // Compteur de places Pionnier (lecture publique du doc pionniers/_meta)
  useEffect(() => {
    getDoc(doc(db, "pionniers", "_meta"))
      .then((snap) => {
        const count = snap.exists() ? snap.data().count || 0 : 0;
        setPlacesLeft(Math.max(PIONNIER_CAP - count, 0));
      })
      .catch(() => setPlacesLeft(PIONNIER_CAP));
  }, []);

  const callCheckout = async (priceId, planId) => {
    setLoading(planId);
    try {
      const headers = { "Content-Type": "application/json" };
      if (user) {
        const token = await user.getIdToken();
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ priceId, planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location = data.url;
      } else {
        alert(data.error || "Erreur lors de la redirection vers le paiement.");
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
      return;
    }
    const priceId = isAnnual ? plan.priceAnnual : plan.priceMonthly;
    if (priceId) callCheckout(priceId, plan.id);
  };

  const handlePionnier = () => {
    if (loading) return;
    if (placesLeft === 0) return;
    if (!user) {
      navigate("/Inscription", { state: { trialOk: true, ref: refCode || null, fromPionnier: true } });
      return;
    }
    callCheckout(PIONNIER_PRICE_ID, "pionnier");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
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

      {/* Bandeau Pionnier — offre à vie, 10 places */}
      {placesLeft !== 0 && (
        <div className="max-w-5xl mx-auto mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-emerald-900 text-white p-6 sm:p-7 shadow-xl">
            <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 text-xs font-extrabold px-4 py-1 rounded-bl-2xl">
              {placesLeft === null ? "OFFRE DE LANCEMENT" : `${placesLeft}/${PIONNIER_CAP} PLACES`}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 text-yellow-400 font-bold text-sm mb-2">
                  <FaCrown /> Offre Pionnier DOM-TOM
                </div>
                <h2 className="text-2xl font-extrabold mb-1">
                  199€ une seule fois · accès <span className="text-yellow-400">Solo à vie</span>
                </h2>
                <p className="text-emerald-100 text-sm max-w-lg">
                  Payez une fois, utilisez Factur'Peyi pour toujours. Factures illimitées, devis, rappels —
                  réservé aux 10 premiers clients. Aucun abonnement, jamais.
                </p>
              </div>
              <button
                onClick={handlePionnier}
                disabled={!!loading || placesLeft === 0}
                className="shrink-0 inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-extrabold px-7 py-4 rounded-xl transition"
              >
                <FaBolt />
                {loading === "pionnier" ? "Redirection..." : "Devenir Pionnier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle mensuel / annuel */}
      <div className="max-w-5xl mx-auto mb-8 flex items-center justify-center gap-3">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
            !isAnnual ? "bg-emerald-700 text-white shadow" : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          Mensuel
        </button>
        <button
          onClick={() => setBilling("annual")}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
            isAnnual ? "bg-emerald-700 text-white shadow" : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          Annuel
          <span className="bg-yellow-400 text-gray-900 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
            2 mois offerts
          </span>
        </button>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {plans.map(plan => {
          const priceLabel = isAnnual ? plan.priceLabelAnnual : plan.priceLabelMonthly;
          const period = plan.trial ? plan.period : isAnnual ? "/an" : "/mois";
          return (
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
                {priceLabel}
              </span>
              <span className={`text-sm ${plan.highlight ? "text-emerald-300" : "text-gray-400"}`}>
                {period}
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
          );
        })}
      </div>

      {/* Plan Cabinet — experts-comptables */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-6 sm:p-7 shadow-xl flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-indigo-200 font-bold text-sm mb-2">
              <FaBuilding /> Plan Cabinet
            </div>
            <h2 className="text-2xl font-extrabold mb-1">
              {isAnnual ? "999€" : "99,99€"}
              <span className="text-indigo-200 text-base font-semibold">{isAnnual ? "/an" : "/mois"}</span>
            </h2>
            <p className="text-indigo-100 text-sm max-w-lg">
              Pour les experts-comptables : gérez la facturation de tous vos clients DOM-TOM depuis un seul compte,
              chacun avec sa TVA et ses mentions légales. Entreprises clientes illimitées.
            </p>
          </div>
          <button
            onClick={() => callCheckout(isAnnual ? CABINET_ANNUAL_PRICE_ID : CABINET_PRICE_ID, "cabinet")}
            disabled={!!loading}
            className="shrink-0 bg-white hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed text-indigo-800 font-extrabold px-7 py-4 rounded-xl transition"
          >
            {loading === "cabinet" ? "Redirection..." : "Choisir Cabinet"}
          </button>
        </div>
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
