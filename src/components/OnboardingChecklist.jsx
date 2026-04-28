import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaCheckCircle, FaCircle, FaTimes, FaArrowRight } from "react-icons/fa";

const STORAGE_KEY = "onboarding_dismissed";

const steps = [
  {
    id: "profile",
    label: "Complétez votre profil entreprise",
    desc: "Ajoutez votre logo, SIRET et adresse pour des factures pro.",
    to: "/dashboard/parametres",
    check: (entreprise) =>
      !!(entreprise?.nom && entreprise?.territoire),
  },
  {
    id: "territory",
    label: "Vérifiez votre territoire & TVA",
    desc: "Guyane, Martinique, Guadeloupe… votre TVA est pré-configurée.",
    to: "/dashboard/parametres",
    check: (entreprise) => !!entreprise?.territoire,
  },
  {
    id: "client",
    label: "Ajoutez votre premier client",
    desc: "Créez une fiche client pour commencer à facturer.",
    to: "/dashboard/clients/ajouter",
    check: (_, counts) => counts.clients > 0,
  },
  {
    id: "invoice",
    label: "Créez votre première facture",
    desc: "Envoyez une facture professionnelle en moins de 2 minutes.",
    to: "/dashboard/facture/nouvelle",
    check: (_, counts) => counts.invoices > 0,
  },
  {
    id: "team",
    label: "Invitez votre comptable ou équipe",
    desc: "Donnez accès à votre comptable avec le rôle approprié.",
    to: "/dashboard/equipe",
    check: (_, counts) => counts.membres > 1,
  },
];

export default function OnboardingChecklist({ counts = {} }) {
  const { entreprise } = useAuth();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1"
  );
  const [open, setOpen] = useState(true);

  const completed = steps.filter((s) => s.check(entreprise, counts));
  const progress = completed.length;
  const total = steps.length;
  const pct = Math.round((progress / total) * 100);

  useEffect(() => {
    if (progress === total) {
      localStorage.setItem(STORAGE_KEY, "1");
      setDismissed(true);
    }
  }, [progress, total]);

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none bg-gradient-to-r from-emerald-50 to-white"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm">
            {progress}/{total}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[#0d1b3e] text-sm">Bien démarrer avec Factur'Peyi</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {progress === total
                ? "Félicitations, vous avez tout configuré !"
                : `${total - progress} étape${total - progress > 1 ? "s" : ""} restante${total - progress > 1 ? "s" : ""}`}
            </div>
          </div>
          {/* Barre de progression */}
          <div className="hidden sm:flex flex-1 mx-4 items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-emerald-700 flex-shrink-0">{pct}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-gray-300 text-xs">{open ? "▲" : "▼"}</span>
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            className="text-gray-300 hover:text-gray-500 transition p-1"
            title="Masquer"
          >
            <FaTimes className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Steps */}
      {open && (
        <div className="divide-y divide-gray-50">
          {steps.map((s) => {
            const done = s.check(entreprise, counts);
            return (
              <div
                key={s.id}
                className={`flex items-start gap-4 px-5 py-4 transition ${done ? "opacity-60" : "hover:bg-gray-50"}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {done ? (
                    <FaCheckCircle className="text-emerald-500 w-5 h-5" />
                  ) : (
                    <FaCircle className="text-gray-200 w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${done ? "line-through text-gray-400" : "text-[#0d1b3e]"}`}>
                    {s.label}
                  </div>
                  {!done && (
                    <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{s.desc}</div>
                  )}
                </div>
                {!done && (
                  <Link
                    to={s.to}
                    className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition mt-0.5"
                  >
                    Faire <FaArrowRight className="w-2.5 h-2.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
