import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { canUseFeature } from "../lib/plans";
import PlanGate from "../components/PlanGate";
import { FaSync, FaPlus, FaPause, FaPlay, FaTrash } from "react-icons/fa";

const FREQ_LABELS = {
  monthly:   "Mensuelle",
  quarterly: "Trimestrielle",
  yearly:    "Annuelle",
};

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-gray-100 rounded-lg animate-pulse" style={{ width: ["50%","70%","40%","60%","30%"][i-1] }} />
        </td>
      ))}
    </tr>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
          <FaTrash className="text-red-500 w-4 h-4" />
        </div>
        <h3 className="font-bold text-[#0d1b3e] text-base mb-1">Supprimer la récurrence</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-50 transition">
            Annuler
          </button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-xl transition">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecurrenceList() {
  const { entreprise, entrepriseId } = useAuth();
  const [recurrences, setRecurrences] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast]             = useState(null);

  const canUse = canUseFeature(entreprise?.plan || "decouverte", "recurrence");

  useEffect(() => {
    if (!entrepriseId) return;
    const q = query(collection(db, "entreprises", entrepriseId, "recurrences"), orderBy("createdAt", "desc"));
    getDocs(q).then((snap) => {
      setRecurrences(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [entrepriseId]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleActive = async (rec) => {
    try {
      await updateDoc(doc(db, "entreprises", entrepriseId, "recurrences", rec.id), {
        active: !rec.active,
      });
      setRecurrences((prev) =>
        prev.map((r) => r.id === rec.id ? { ...r, active: !r.active } : r)
      );
      showToast(rec.active ? "Récurrence mise en pause." : "Récurrence réactivée.", "success");
    } catch {
      showToast("Erreur lors de la mise à jour.", "error");
    }
  };

  const handleDelete = (rec) => setConfirmDelete(rec);

  const confirmDeleteRec = async () => {
    try {
      await deleteDoc(doc(db, "entreprises", entrepriseId, "recurrences", confirmDelete.id));
      setRecurrences((prev) => prev.filter((r) => r.id !== confirmDelete.id));
      showToast("Récurrence supprimée.", "success");
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  const activeCount   = recurrences.filter((r) => r.active).length;
  const monthlyRevenu = recurrences
    .filter((r) => r.active)
    .reduce((sum, r) => {
      if (r.frequence === "monthly")   return sum + (r.totalTTC || 0);
      if (r.frequence === "quarterly") return sum + (r.totalTTC || 0) / 3;
      if (r.frequence === "yearly")    return sum + (r.totalTTC || 0) / 12;
      return sum;
    }, 0);

  if (!canUse) {
    return (
      <main>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <FaSync className="text-emerald-600 w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#0d1b3e]">Factures récurrentes</h2>
            <p className="text-sm text-gray-400">Automatisez vos factures mensuelles et trimestrielles.</p>
          </div>
        </div>
        <PlanGate
          reason="Les factures récurrentes sont disponibles à partir du plan Pro."
          upgradeRequired="pro"
        />
      </main>
    );
  }

  return (
    <main>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <FaSync className="text-emerald-600 w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#0d1b3e]">Factures récurrentes</h2>
            <p className="text-sm text-gray-400">Générées automatiquement à chaque échéance.</p>
          </div>
        </div>
        <Link
          to="/dashboard/factures/recurrentes/nouvelle"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition"
        >
          <FaPlus className="w-3 h-3" /> Nouvelle récurrence
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-gray-400 mb-1">Récurrences actives</div>
          <div className="text-2xl font-extrabold text-[#0d1b3e]">{activeCount}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-gray-400 mb-1">Revenu mensuel estimé</div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {monthlyRevenu.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hidden sm:block">
          <div className="text-xs text-gray-400 mb-1">Total récurrences</div>
          <div className="text-2xl font-extrabold text-[#0d1b3e]">{recurrences.length}</div>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <table className="w-full text-sm">
            <tbody>{[1, 2, 3].map((i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        ) : recurrences.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <FaSync className="text-emerald-300 w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-500">Aucune facture récurrente</p>
            <p className="text-xs text-gray-400 mt-1 mb-5">
              Configurez vos contrats mensuels pour ne plus jamais oublier une facture.
            </p>
            <Link
              to="/dashboard/factures/recurrentes/nouvelle"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition"
            >
              <FaPlus className="w-3 h-3" /> Créer une récurrence
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Montant TTC</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Fréquence</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Prochaine</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Statut</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recurrences.map((rec) => {
                const next = rec.nextDate?.toDate?.();
                const isLate = next && next < new Date() && rec.active;
                return (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-[#0d1b3e]">{rec.clientNom || "—"}</td>
                    <td className="px-5 py-4 text-gray-500 max-w-xs truncate hidden md:table-cell">{rec.description}</td>
                    <td className="px-5 py-4 font-semibold text-[#0d1b3e]">
                      {rec.totalTTC?.toFixed(2)} €
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                        <FaSync className="w-2.5 h-2.5" />
                        {FREQ_LABELS[rec.frequence] || rec.frequence}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {next ? (
                        <span className={`text-xs font-medium ${isLate ? "text-red-500" : "text-gray-500"}`}>
                          {next.toLocaleDateString("fr-FR")}
                          {isLate && " ⚠️"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      {rec.active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          En pause
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleActive(rec)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition group ${
                            rec.active
                              ? "bg-amber-50 hover:bg-amber-100"
                              : "bg-emerald-50 hover:bg-emerald-100"
                          }`}
                          title={rec.active ? "Mettre en pause" : "Réactiver"}
                        >
                          {rec.active
                            ? <FaPause className="w-3 h-3 text-amber-500" />
                            : <FaPlay  className="w-3 h-3 text-emerald-500" />
                          }
                        </button>
                        <button
                          onClick={() => handleDelete(rec)}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition"
                          title="Supprimer"
                        >
                          <FaTrash className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Info cron */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Les factures sont générées automatiquement chaque jour à 9h. La date de première génération correspond à la date de départ choisie.
      </p>

      {confirmDelete && (
        <ConfirmModal
          message={`Supprimer la récurrence "${confirmDelete.description}" pour ${confirmDelete.clientNom} ? Les factures déjà générées ne seront pas supprimées.`}
          onConfirm={confirmDeleteRec}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
          {toast.message}
        </div>
      )}
    </main>
  );
}
