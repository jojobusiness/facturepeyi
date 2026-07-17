import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canUseFeature } from "../lib/plans";
import { IA_INSIGHTS_ENABLED } from "../lib/features";
import { FaLock, FaSync, FaLightbulb } from "react-icons/fa";

const PRIORITE_CLASSES = {
  haute:   "border-red-200 bg-red-50",
  moyenne: "border-amber-200 bg-amber-50",
  basse:   "border-gray-200 bg-gray-50",
};
const PRIORITE_DOT = {
  haute: "bg-red-500",
  moyenne: "bg-amber-400",
  basse: "bg-gray-300",
};

// Cartes factices pour le teaser flouté des plans non éligibles
const TEASER = [
  { titre: "Provision de TVA à anticiper", constat: "Votre TVA collectée du trimestre atteint ███ €." },
  { titre: "Un client paie souvent en retard", constat: "███ cumule 3 factures en retard pour ███ €." },
  { titre: "Dépenses carburant en hausse", constat: "+██ % vs votre moyenne des 6 derniers mois." },
];

export default function InsightsWidget() {
  const { user, entreprise } = useAuth();
  const [state, setState] = useState({ loading: true, suggestions: null, refreshRestants: 0, error: null });
  const [refreshing, setRefreshing] = useState(false);

  // Pionniers (lifetime) : toutes les fonctionnalités incluses, dont le Conseiller IA
  const allowed = canUseFeature(entreprise?.plan || "decouverte", "ia-insights")
    || entreprise?.lifetime === true;

  const fetchInsights = async (refresh = false) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ refresh }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur");
      setState({ loading: false, suggestions: json.suggestions, refreshRestants: json.refreshRestants, error: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  };

  useEffect(() => {
    if (!IA_INSIGHTS_ENABLED || !allowed || !user) return;
    fetchInsights(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allowed]);

  if (!IA_INSIGHTS_ENABLED || !entreprise) return null;

  // ── Teaser verrouillé (plans Découverte / Solo / Pionnier) ──
  if (!allowed) {
    return (
      <div className="relative bg-white border border-gray-100 rounded-2xl shadow-sm p-5 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <FaLightbulb className="text-violet-500 w-4 h-4" />
          <h3 className="text-sm font-bold text-[#0d1b3e]">Conseiller IA</h3>
          <span className="text-[10px] font-bold uppercase tracking-wide bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Pro</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 blur-[5px] select-none pointer-events-none" aria-hidden="true">
          {TEASER.map((t, i) => (
            <div key={i} className="border border-gray-200 bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-bold text-[#0d1b3e]">{t.titre}</p>
              <p className="text-xs text-gray-500 mt-1">{t.constat}</p>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
            <FaLock className="text-violet-600 w-3.5 h-3.5" />
          </div>
          <p className="text-sm font-semibold text-[#0d1b3e]">Des suggestions personnalisées sur vos chiffres</p>
          <Link
            to="/Forfaits"
            className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            Débloquer avec le plan Pro
          </Link>
        </div>
      </div>
    );
  }

  // ── Version réelle (Pro / Expert / Cabinet) ──
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <FaLightbulb className="text-violet-500 w-4 h-4" />
          <h3 className="text-sm font-bold text-[#0d1b3e]">Conseiller IA</h3>
        </div>
        {state.suggestions && (
          <button
            onClick={async () => { setRefreshing(true); await fetchInsights(true); setRefreshing(false); }}
            disabled={refreshing || state.refreshRestants === 0}
            title={state.refreshRestants === 0 ? "Limite d'actualisations atteinte ce mois-ci" : ""}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-violet-600 transition disabled:opacity-40"
          >
            <FaSync className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser ({state.refreshRestants} restant{state.refreshRestants !== 1 ? "s" : ""})
          </button>
        )}
      </div>

      {state.loading && (
        <div className="flex items-center gap-3 text-sm text-gray-400 py-4">
          <span className="inline-block w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          Analyse de vos chiffres en cours...
        </div>
      )}

      {state.error && !state.loading && (
        <p className="text-sm text-gray-400 py-2">{state.error}</p>
      )}

      {state.suggestions && state.suggestions.length === 0 && (
        <p className="text-sm text-gray-400 py-2">
          Pas encore assez de données pour des suggestions fiables — revenez après quelques factures et dépenses.
        </p>
      )}

      {state.suggestions && state.suggestions.length > 0 && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {state.suggestions.map((s, i) => (
            <div key={i} className={`border rounded-xl p-4 ${PRIORITE_CLASSES[s.priorite] || PRIORITE_CLASSES.basse}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITE_DOT[s.priorite] || PRIORITE_DOT.basse}`} />
                <p className="text-sm font-bold text-[#0d1b3e]">{s.titre}</p>
              </div>
              <p className="text-xs text-gray-600 mb-2">{s.constat}</p>
              <p className="text-xs text-gray-800 font-medium">→ {s.action}</p>
              {s.impact && <p className="text-[11px] text-gray-400 mt-2 italic">{s.impact}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
