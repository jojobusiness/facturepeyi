import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DepenseList() {
  const { entrepriseId } = useAuth();
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!entrepriseId) return;
    const q = query(collection(db, "entreprises", entrepriseId, "depenses"), orderBy("date", "desc"));
    getDocs(q).then((snap) => {
      setDepenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [entrepriseId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette dépense ?")) return;
    await deleteDoc(doc(db, "entreprises", entrepriseId, "depenses", id));
    setDepenses((prev) => prev.filter((d) => d.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement...</div>;

  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d1b3e]">Dépenses</h2>
          <p className="text-sm text-gray-400 mt-0.5">{depenses.length} dépense{depenses.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/dashboard/depenses/import"
            className="border border-gray-200 text-gray-600 hover:border-gray-300 font-medium text-sm px-4 py-2.5 rounded-xl transition"
          >
            Importer CSV
          </Link>
          <Link
            to="/dashboard/depenses/nouvelle"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition"
          >
            + Nouvelle dépense
          </Link>
        </div>
      </div>

      {depenses.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">💸</div>
          <p className="text-gray-500 font-medium">Aucune dépense enregistrée</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">Commencez à suivre vos achats et charges</p>
          <Link to="/dashboard/depenses/nouvelle" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition">
            Ajouter une dépense
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fournisseur</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant TTC</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {depenses.map((dep) => (
                <tr key={dep.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-[#0d1b3e]">{dep.fournisseur}</td>
                  <td className="px-5 py-4 text-gray-500 hidden md:table-cell">{dep.description}</td>
                  <td className="px-5 py-4 font-semibold text-[#0d1b3e]">{dep.montantTTC?.toFixed(2)} €</td>
                  <td className="px-5 py-4 text-gray-400 hidden sm:table-cell">
                    {dep.date?.toDate().toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(dep.id)}
                      className="text-xs font-medium text-red-400 hover:text-red-600 transition"
                    >
                      Supprimer
                    </button>
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
