import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  FaCopy, FaCheckCircle, FaEnvelope, FaPercent, FaUsers, FaWallet, FaChartLine, FaBuilding,
} from "react-icons/fa";
import { monthlyCommission, aggregateCommission, COMMISSION_RATE } from "../lib/commission";
import { getPlan } from "../lib/plans";

const SITE_URL = "https://facturepeyi.com";

const BILLING_BADGE = {
  annual: { label: "annuel", cls: "bg-indigo-50 text-indigo-600" },
  lifetime: { label: "à vie", cls: "bg-yellow-50 text-yellow-700" },
};

export default function PrescriptionCabinet() {
  const { entreprise, entrepriseId, isCabinet } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Le code de prescription = 8 premiers caractères de l'entrepriseId (même mécanique que le parrainage)
  const code = entrepriseId ? entrepriseId.slice(0, 8).toUpperCase() : "—";
  const prescriptionUrl = `${SITE_URL}/Forfaits?ref=${code}`;

  useEffect(() => {
    if (!code || code === "—") return;
    auth.currentUser?.getIdToken().then((token) =>
      fetch(`/api/get-referrals?code=${code}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).then((r) => r?.json())
      .then((data) => {
        if (data?.referrals) setReferrals(data.referrals);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [code]);

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Facturation conforme pour vos clients ultramarins");
    const body = encodeURIComponent(
      `Bonjour,\n\nJe vous recommande Factur'Peyi, l'outil de facturation pensé pour les DOM-TOM ` +
      `(TVA 8,5 % / 2,1 %, octroi de mer, mentions art. 294, export FEC, Factur-X pour la réforme 2026).\n\n` +
      `Créez votre compte ici : ${prescriptionUrl}\n\nBien à vous.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const { activeCount, monthlyTotal, annualTotal } = aggregateCommission(referrals);
  const pct = Math.round(COMMISSION_RATE * 100);

  // Réservé aux cabinets dans un premier temps — le levier prescription cible les experts-comptables
  if (!isCabinet) {
    return (
      <main className="max-w-lg mx-auto py-16 text-center">
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-8">
          <FaPercent className="w-9 h-9 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#0d1b3e] mb-2">Programme réservé aux cabinets</h2>
          <p className="text-sm text-gray-500 mb-5">
            Le programme prescripteur ({pct} % de commission récurrente) est destiné aux cabinets
            d'expertise comptable. Pour parrainer un confrère et gagner des mois offerts, utilisez le parrainage.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/dashboard/parrainage" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition">
              Aller au parrainage
            </Link>
            <Link to="/Forfaits" className="bg-white border border-indigo-200 text-indigo-700 hover:border-indigo-400 font-semibold text-sm px-5 py-3 rounded-xl transition">
              Découvrir le plan Cabinet
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0d1b3e]">Programme prescripteur</h2>
        <p className="text-sm text-gray-400 mt-1">
          Recommandez Factur'Peyi à vos clients et touchez {pct} % de commission récurrente — à vie, tant qu'ils sont abonnés.
        </p>
      </div>

      {/* Carte principale */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white mb-5 shadow-lg shadow-indigo-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <FaPercent className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-base">{pct} % de commission récurrente</div>
            <div className="text-indigo-200 text-xs">Sur chaque abonnement de vos clients recommandés, chaque mois</div>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-4 mb-4">
          <p className="text-xs text-indigo-200 mb-1 font-medium uppercase tracking-wide">Votre lien de prescription</p>
          <p className="font-mono text-sm text-white break-all leading-relaxed">{prescriptionUrl}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => copy(prescriptionUrl)}
            className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm py-2.5 rounded-xl transition"
          >
            {copied ? <FaCheckCircle className="w-4 h-4" /> : <FaCopy className="w-4 h-4" />}
            {copied ? "Copié !" : "Copier le lien"}
          </button>
          <button
            onClick={handleEmail}
            className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm py-2.5 rounded-xl transition"
          >
            <FaEnvelope className="w-4 h-4" />
            Envoyer par email
          </button>
        </div>
      </div>

      {/* KPIs commission */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { icon: FaUsers, label: "Clients recommandés", value: loading ? "—" : referrals.length, color: "text-[#0d1b3e]" },
          { icon: FaCheckCircle, label: "Abonnés actifs", value: loading ? "—" : activeCount, color: "text-emerald-600" },
          { icon: FaWallet, label: "Commission / mois", value: loading ? "—" : `${monthlyTotal.toFixed(2)} €`, color: "text-indigo-600" },
          { icon: FaChartLine, label: "Projection / an", value: loading ? "—" : `${annualTotal.toFixed(2)} €`, color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
            <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Comment ça marche */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h3 className="text-sm font-bold text-[#0d1b3e] mb-4 flex items-center gap-2">
          <FaUsers className="text-indigo-600 w-4 h-4" /> Comment ça marche
        </h3>
        <div className="space-y-3">
          {[
            "Partagez votre lien de prescription à vos clients entrepreneurs ultramarins.",
            "Chacun crée son compte Factur'Peyi via votre lien et souscrit à un plan payant.",
            `Vous touchez ${pct} % du montant de son abonnement, chaque mois, tant qu'il reste client.`,
            "Suivi en temps réel ci-dessus ; versement de la commission selon les conditions du partenariat.",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des clients recommandés */}
      {!loading && referrals.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-[#0d1b3e]">Vos clients recommandés</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Entreprise</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Territoire</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Commission / mois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {referrals.map((r) => {
                const active = r.planStatus === "active";
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-[#0d1b3e]">{r.nom || "—"}</td>
                    <td className="px-5 py-3 text-gray-500 capitalize">{r.territoire || "—"}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {r.plan ? getPlan(r.plan).name : "—"}
                      {BILLING_BADGE[r.planBilling] && (
                        <span className={`ml-1.5 text-xs font-medium px-1.5 py-0.5 rounded ${BILLING_BADGE[r.planBilling].cls}`}>
                          {BILLING_BADGE[r.planBilling].label}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {active
                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full"><FaCheckCircle className="w-3 h-3" /> Actif</span>
                        : <span className="text-xs font-medium bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">En essai</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-indigo-600">
                      {active ? `${monthlyCommission(r.plan).toFixed(2)} €` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && referrals.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <FaUsers className="w-9 h-9 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">Aucun client recommandé pour l'instant</p>
          <p className="text-gray-400 text-sm">Partagez votre lien de prescription pour commencer à toucher vos commissions.</p>
        </div>
      )}
    </main>
  );
}
