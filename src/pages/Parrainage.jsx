import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { FaCopy, FaWhatsapp, FaCheckCircle, FaGift, FaUsers } from "react-icons/fa";

const SITE_URL = "https://facturepeyi.com";

export default function Parrainage() {
  const { entreprise, entrepriseId } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Code = 8 premiers caractères de l'entrepriseId en majuscules
  const code = entrepriseId ? entrepriseId.slice(0, 8).toUpperCase() : "—";
  const referralUrl = `${SITE_URL}/Forfaits?ref=${code}`;

  useEffect(() => {
    if (!code || code === "—") return;
    // Cherche les entreprises qui ont été référées par ce code
    getDocs(query(collection(db, "entreprises"), where("referredBy", "==", code)))
      .then((snap) => {
        setReferrals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Salut ! J'utilise Factur'Peyi pour ma facturation en ${entreprise?.territoire || "DOM-TOM"} — c'est vraiment pratique. Essaie gratuitement avec mon lien : ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const activeReferrals = referrals.filter((r) => r.planStatus === "active");
  const pendingReferrals = referrals.filter((r) => r.planStatus !== "active");

  return (
    <main className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0d1b3e]">Programme de parrainage</h2>
        <p className="text-sm text-gray-400 mt-1">Invitez vos collègues et gagnez des mois offerts</p>
      </div>

      {/* Carte principale */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white mb-5 shadow-lg shadow-emerald-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <FaGift className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-base">1 mois offert par filleul</div>
            <div className="text-emerald-200 text-xs">Pour vous et votre filleul, dès son premier paiement</div>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-4 mb-4">
          <p className="text-xs text-emerald-200 mb-1 font-medium uppercase tracking-wide">Votre lien de parrainage</p>
          <p className="font-mono text-sm text-white break-all leading-relaxed">{referralUrl}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm py-2.5 rounded-xl transition"
          >
            {copied ? <FaCheckCircle className="w-4 h-4" /> : <FaCopy className="w-4 h-4" />}
            {copied ? "Copié !" : "Copier le lien"}
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm py-2.5 rounded-xl transition"
          >
            <FaWhatsapp className="w-4 h-4" />
            Partager WhatsApp
          </button>
        </div>
      </div>

      {/* Code seul */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Votre code</p>
          <p className="font-mono text-2xl font-extrabold text-[#0d1b3e] tracking-widest">{code}</p>
        </div>
        <button
          onClick={handleCopy}
          className="text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-400 rounded-xl px-4 py-2 text-xs font-semibold transition"
        >
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Filleuls invités", value: loading ? "—" : referrals.length, color: "text-[#0d1b3e]" },
          { label: "Abonnés actifs", value: loading ? "—" : activeReferrals.length, color: "text-emerald-600" },
          { label: "Mois gagnés", value: loading ? "—" : activeReferrals.length, color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 text-center">
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Comment ça marche */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h3 className="text-sm font-bold text-[#0d1b3e] mb-4 flex items-center gap-2">
          <FaUsers className="text-emerald-600 w-4 h-4" /> Comment ça marche
        </h3>
        <div className="space-y-3">
          {[
            { step: "1", text: "Partagez votre lien ou votre code à un collègue entrepreneur" },
            { step: "2", text: "Il s'inscrit sur Factur'Peyi via votre lien et souscrit à un plan payant" },
            { step: "3", text: "Vous recevez 1 mois offert sur votre abonnement — lui aussi !" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {step}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Liste filleuls */}
      {!loading && referrals.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-[#0d1b3e]">Vos filleuls</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Entreprise</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Territoire</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-[#0d1b3e]">{r.nom || "—"}</td>
                  <td className="px-5 py-3 text-gray-500 capitalize">{r.territoire || "—"}</td>
                  <td className="px-5 py-3">
                    {r.planStatus === "active"
                      ? <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full"><FaCheckCircle className="w-3 h-3" /> Actif</span>
                      : <span className="text-xs font-medium bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">En essai</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
