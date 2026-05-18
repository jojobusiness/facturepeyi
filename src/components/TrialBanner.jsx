import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaCrown, FaTimes, FaArrowRight } from "react-icons/fa";

const STORAGE_PREFIX = "trial_banner_dismissed_";

function daysLeft(trialEndsAt) {
  if (!trialEndsAt) return null;
  const end = trialEndsAt?.toDate?.()?.getTime?.() ?? new Date(trialEndsAt).getTime();
  if (!end || isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / 86_400_000);
}

function getStyle(d) {
  if (d <= 0)   return { tone: "expired", bg: "bg-red-600", text: "text-white", ring: "ring-red-700", btn: "bg-white text-red-700 hover:bg-red-50" };
  if (d <= 3)   return { tone: "critical", bg: "bg-red-500", text: "text-white", ring: "ring-red-600", btn: "bg-white text-red-700 hover:bg-red-50" };
  if (d <= 7)   return { tone: "urgent",  bg: "bg-orange-500", text: "text-white", ring: "ring-orange-600", btn: "bg-white text-orange-700 hover:bg-orange-50" };
  if (d <= 15)  return { tone: "warning", bg: "bg-amber-400", text: "text-amber-950", ring: "ring-amber-500", btn: "bg-amber-950 text-white hover:bg-amber-900" };
  return { tone: "ok", bg: "bg-emerald-50 border border-emerald-200", text: "text-emerald-900", ring: "", btn: "bg-emerald-600 text-white hover:bg-emerald-700" };
}

export default function TrialBanner() {
  const { entreprise } = useAuth();
  const d = useMemo(() => daysLeft(entreprise?.trialEndsAt), [entreprise]);
  const isTrial = entreprise?.planStatus === "trial";

  // Bucket de dismissal selon urgence (un dismiss J-15 ne masque pas le J-7 plus tard)
  const bucket = useMemo(() => {
    if (d === null) return "n/a";
    if (d <= 3) return "critical";
    if (d <= 7) return "urgent";
    if (d <= 15) return "warning";
    return "ok";
  }, [d]);

  const storageKey = entreprise?.id ? `${STORAGE_PREFIX}${entreprise.id}_${bucket}` : null;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!storageKey) { setDismissed(false); return; }
    setDismissed(localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  if (!isTrial || d === null || dismissed) return null;

  const style = getStyle(d);
  const dismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, "1");
    setDismissed(true);
  };

  const headline = d <= 0
    ? "Votre essai gratuit a expiré"
    : d === 1
      ? "Dernier jour d'essai gratuit"
      : `Plus que ${d} jour${d > 1 ? "s" : ""} d'essai gratuit`;

  const sub = d <= 0
    ? "Activez une formule pour continuer à utiliser toutes les fonctionnalités."
    : d <= 3
      ? "Activez Solo (19,99 €/mois) maintenant pour ne perdre aucun accès."
      : d <= 7
        ? "Vos rappels automatiques et le portail client seront limités après l'essai."
        : d <= 15
          ? "À mi-parcours — pensez à choisir votre formule pour garder toutes les fonctionnalités."
          : "Profitez de toutes les fonctionnalités. Choisissez votre formule à tout moment.";

  return (
    <div className={`${style.bg} ${style.text} ${style.ring} rounded-xl mb-5 px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm`}>
      <FaCrown className={`w-5 h-5 flex-shrink-0 ${d <= 7 ? "text-yellow-200" : ""}`} />
      <div className="flex-1 min-w-[200px]">
        <div className="font-bold text-sm leading-tight">{headline}</div>
        <div className="text-xs opacity-90 mt-0.5">{sub}</div>
      </div>
      <Link
        to="/Forfaits"
        className={`${style.btn} text-xs font-bold px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition flex-shrink-0`}
      >
        {d <= 7 ? "Activer maintenant" : "Voir les formules"}
        <FaArrowRight className="w-3 h-3" />
      </Link>
      <button
        onClick={dismiss}
        title="Masquer (réapparaîtra à la prochaine étape d'urgence)"
        className="opacity-60 hover:opacity-100 transition p-1 flex-shrink-0"
      >
        <FaTimes className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
