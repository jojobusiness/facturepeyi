import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const YEAR = new Date().getFullYear();

// Génère les échéances fiscales selon le régime
function getEcheances(regime, territoire) {
  const all = [];

  if (regime === "auto-entrepreneur") {
    // Déclarations mensuelles ou trimestrielles du CA + cotisations URSSAF
    const quarters = [
      { label: "Déclaration CA T1 + cotisations URSSAF",  date: `${YEAR}-04-30`, type: "urssaf" },
      { label: "Déclaration CA T2 + cotisations URSSAF",  date: `${YEAR}-07-31`, type: "urssaf" },
      { label: "Déclaration CA T3 + cotisations URSSAF",  date: `${YEAR}-10-31`, type: "urssaf" },
      { label: "Déclaration CA T4 + cotisations URSSAF",  date: `${YEAR + 1}-01-31`, type: "urssaf" },
      { label: "Déclaration CFE (si applicable)",          date: `${YEAR}-12-15`, type: "local" },
      { label: "Déclaration revenus (formulaire 2042 C PRO)", date: `${YEAR}-05-25`, type: "ir" },
    ];
    all.push(...quarters);
  } else if (regime === "micro-bic" || regime === "micro-bnc") {
    all.push(
      { label: "Déclaration revenus BIC/BNC (formulaire 2042 C PRO)", date: `${YEAR}-05-25`, type: "ir" },
      { label: "Cotisations sociales TNS — acompte T1", date: `${YEAR}-02-05`, type: "urssaf" },
      { label: "Cotisations sociales TNS — acompte T2", date: `${YEAR}-05-05`, type: "urssaf" },
      { label: "Cotisations sociales TNS — acompte T3", date: `${YEAR}-08-05`, type: "urssaf" },
      { label: "Cotisations sociales TNS — acompte T4", date: `${YEAR}-11-05`, type: "urssaf" },
      { label: "CFE (Cotisation Foncière des Entreprises)", date: `${YEAR}-12-15`, type: "local" },
      { label: "Déclaration résultat annuel", date: `${YEAR}-05-05`, type: "liasse" },
    );
  } else {
    // Régime réel
    all.push(
      // TVA trimestrielle (CA3)
      { label: "TVA T1 — Déclaration CA3 (janv.–mars)",  date: `${YEAR}-04-19`, type: "tva" },
      { label: "TVA T2 — Déclaration CA3 (avr.–juin)",   date: `${YEAR}-07-19`, type: "tva" },
      { label: "TVA T3 — Déclaration CA3 (juil.–sept.)", date: `${YEAR}-10-19`, type: "tva" },
      { label: "TVA T4 — Déclaration CA3 (oct.–déc.)",   date: `${YEAR + 1}-01-19`, type: "tva" },
      // IS / IR acomptes
      { label: "Acompte IS / IR — 1er acompte",  date: `${YEAR}-03-15`, type: "is" },
      { label: "Acompte IS / IR — 2e acompte",   date: `${YEAR}-06-15`, type: "is" },
      { label: "Acompte IS / IR — 3e acompte",   date: `${YEAR}-09-15`, type: "is" },
      { label: "Acompte IS / IR — 4e acompte",   date: `${YEAR}-12-15`, type: "is" },
      // Liasse fiscale
      { label: "Dépôt liasse fiscale (bilan + compte de résultat)", date: `${YEAR}-05-05`, type: "liasse" },
      // Cotisations
      { label: "Cotisations TNS — acompte T1", date: `${YEAR}-02-05`, type: "urssaf" },
      { label: "Cotisations TNS — acompte T2", date: `${YEAR}-05-05`, type: "urssaf" },
      { label: "Cotisations TNS — acompte T3", date: `${YEAR}-08-05`, type: "urssaf" },
      { label: "Cotisations TNS — acompte T4", date: `${YEAR}-11-05`, type: "urssaf" },
      { label: "CFE (Cotisation Foncière des Entreprises)", date: `${YEAR}-12-15`, type: "local" },
    );
  }

  // Octroi de mer DOM — déclaration mensuelle
  if (["martinique", "guadeloupe", "reunion"].includes(territoire)) {
    for (let m = 1; m <= 12; m++) {
      const month = String(m).padStart(2, "0");
      const nextMonth = m === 12 ? `${YEAR + 1}-01` : `${YEAR}-${String(m + 1).padStart(2, "0")}`;
      all.push({
        label: `Déclaration Octroi de mer — mois ${m < 10 ? "0" : ""}${m}`,
        date: `${nextMonth}-25`,
        type: "octroi",
      });
    }
  }

  return all.sort((a, b) => new Date(a.date) - new Date(b.date));
}

const TYPE_CONFIG = {
  tva:    { label: "TVA",          color: "bg-blue-100 text-blue-700",   dot: "bg-blue-500" },
  urssaf: { label: "URSSAF",       color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  is:     { label: "IS/IR",        color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  liasse: { label: "Liasse",       color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  ir:     { label: "Revenu",       color: "bg-teal-100 text-teal-700",   dot: "bg-teal-500" },
  local:  { label: "Local",        color: "bg-gray-100 text-gray-600",   dot: "bg-gray-400" },
  octroi: { label: "Octroi de mer", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
};

function urgencyClass(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (d - now) / 86_400_000;
  if (diff < 0) return "text-gray-400";
  if (diff <= 14) return "text-red-600 font-semibold";
  if (diff <= 30) return "text-orange-500 font-medium";
  return "text-gray-700";
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function CalendrierFiscal() {
  const { entreprise } = useAuth();
  const regime = entreprise?.regime || "reel";
  const territoire = entreprise?.territoire || "metropole";
  const showOctroi = entreprise?.octroiDeMer === true;

  const echeances = getEcheances(regime, territoire);
  const today = new Date();

  const upcoming = echeances.filter((e) => new Date(e.date) >= today).slice(0, 5);
  const all = echeances.filter((e) => !showOctroi ? e.type !== "octroi" : true);
  const past = all.filter((e) => new Date(e.date) < today);
  const future = all.filter((e) => new Date(e.date) >= today);

  const regimeLabel = {
    "auto-entrepreneur": "Auto-entrepreneur",
    "micro-bic": "Micro-BIC",
    "micro-bnc": "Micro-BNC",
    "reel": "Régime réel",
  }[regime] || regime;

  return (
    <main className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d1b3e]">Calendrier fiscal {YEAR}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Régime : <span className="font-medium text-gray-600">{regimeLabel}</span>
            {territoire && <> · Territoire : <span className="font-medium text-gray-600">{territoire}</span></>}
          </p>
        </div>
        <Link to="/dashboard/parametres" className="text-xs text-emerald-700 hover:underline font-medium">
          Changer le régime →
        </Link>
      </div>

      {/* Prochaines échéances */}
      {upcoming.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Prochaines échéances</h3>
          <div className="space-y-2">
            {upcoming.map((e, i) => {
              const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.local;
              const diff = Math.ceil((new Date(e.date) - today) / 86_400_000);
              return (
                <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0d1b3e] leading-snug truncate">{e.label}</p>
                    <p className={`text-xs mt-0.5 ${urgencyClass(e.date)}`}>{formatDate(e.date)}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    {diff <= 30 && (
                      <p className={`text-xs mt-1 ${diff <= 14 ? "text-red-600 font-bold" : "text-orange-500"}`}>
                        J−{diff}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Calendrier complet */}
      <section>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Toutes les échéances {YEAR}</h3>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {future.map((e, i) => {
            const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.local;
            return (
              <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${i < future.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${urgencyClass(e.date)}`}>{e.label}</p>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-2">
                  <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  <span className={`text-xs font-medium ${urgencyClass(e.date)}`}>{formatDate(e.date)}</span>
                </div>
              </div>
            );
          })}
          {past.length > 0 && (
            <>
              <div className="px-5 py-2 bg-gray-50 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Échéances passées</span>
              </div>
              {past.map((e, i) => {
                const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.local;
                return (
                  <div key={i} className={`flex items-center gap-3 px-5 py-3 opacity-50 ${i < past.length - 1 ? "border-b border-gray-50" : ""}`}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0 bg-gray-300" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-400 line-through leading-snug truncate">{e.label}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(e.date)}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </section>

      <p className="text-xs text-gray-400 mt-4 leading-relaxed">
        Ces dates sont fournies à titre indicatif. Consultez un expert-comptable pour votre situation spécifique.
        Certaines dates peuvent varier selon votre régime de TVA (mensuel vs trimestriel) et vos obligations locales.
      </p>
    </main>
  );
}
