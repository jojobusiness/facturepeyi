import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

const STATUS_CONFIG = {
  "en attente": { label: "En attente", classes: "bg-yellow-50 text-yellow-700" },
  "payée":      { label: "Payée",      classes: "bg-emerald-50 text-emerald-700" },
  "en retard":  { label: "En retard",  classes: "bg-red-50 text-red-600" },
  "annulée":    { label: "Annulée",    classes: "bg-gray-100 text-gray-500" },
};

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default function FacturesClient() {
  const { clientId } = useParams();
  const { entrepriseId } = useAuth();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!entrepriseId || !clientId) return;
    const q = query(
      collection(db, "entreprises", entrepriseId, "factures"),
      where("clientId", "==", clientId)
    );
    getDocs(q).then((snap) => {
      setFactures(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [entrepriseId, clientId]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement...</div>;

  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-[#0d1b3e]">Factures du client</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate("/dashboard/clients")}
            className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm px-4 py-2.5 rounded-xl transition"
          >
            ← Retour
          </button>
          <button
            onClick={() => navigate(`/dashboard/devis/nouveau?client=${clientId}`)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition"
          >
            + Devis
          </button>
          <button
            onClick={() => navigate(`/dashboard/facture/nouvelle?client=${clientId}`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition"
          >
            + Nouvelle facture
          </button>
        </div>
      </div>

      {factures.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <p className="text-gray-500 font-medium">Aucune facture pour ce client</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">Créez-en une en quelques clics, le client est déjà pré-rempli</p>
          <button
            onClick={() => navigate(`/dashboard/facture/nouvelle?client=${clientId}`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition"
          >
            Créer une facture
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Description", "Montant TTC", "Date", "Statut"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {factures.map((f) => {
                const cfg = STATUS_CONFIG[f.status] || STATUS_CONFIG["en attente"];
                return (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-[#0d1b3e] font-medium">{f.description}</td>
                    <td className="px-5 py-4 font-semibold text-[#0d1b3e]">{euro.format(f.totalTTC || 0)}</td>
                    <td className="px-5 py-4 text-gray-400">{f.date?.toDate().toLocaleDateString("fr-FR")}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.classes}`}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
