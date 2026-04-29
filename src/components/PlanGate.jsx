import { Link } from "react-router-dom";
import { FaLock } from "react-icons/fa";

/**
 * Shown when the user hits a plan limit or tries to use a locked feature.
 * Props:
 *   reason          — string explaining why access is blocked
 *   upgradeRequired — planId to upgrade to (optional, for the CTA label)
 *   className       — optional extra classes for the wrapper
 */
export default function PlanGate({ reason, upgradeRequired, className = "" }) {
  const planLabels = {
    solo: "Solo",
    pro: "Pro",
    expert: "Expert",
  };
  const label = planLabels[upgradeRequired] || "supérieur";

  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 max-w-sm w-full shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-4">
          <FaLock className="text-yellow-600 w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Limite atteinte</h3>
        <p className="text-sm text-gray-600 mb-6">{reason}</p>
        <Link
          to="/Forfaits"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition"
        >
          Passer au plan {label}
        </Link>
      </div>
    </div>
  );
}
