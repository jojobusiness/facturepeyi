import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export default function Clients() {
  const { entrepriseId } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!entrepriseId) return;
    const q = query(collection(db, "entreprises", entrepriseId, "clients"), orderBy("createdAt", "desc"));
    getDocs(q).then((snap) => {
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [entrepriseId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce client ?")) return;
    await deleteDoc(doc(db, "entreprises", entrepriseId, "clients", id));
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement...</div>;

  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d1b3e]">Clients</h2>
          <p className="text-sm text-gray-400 mt-0.5">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          to="/dashboard/clients/ajouter"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition"
        >
          + Ajouter un client
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-500 font-medium">Aucun client pour l'instant</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">Ajoutez votre premier client pour commencer à facturer</p>
          <Link to="/dashboard/clients/ajouter" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition">
            Ajouter un client
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Téléphone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Adresse</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-[#0d1b3e]">{client.nom}</td>
                  <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">{client.email || "—"}</td>
                  <td className="px-5 py-4 text-gray-500 hidden md:table-cell">{client.tel || "—"}</td>
                  <td className="px-5 py-4 text-gray-400 hidden lg:table-cell">{client.adresse || "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => navigate(`/dashboard/clients/modifier/${client.id}`)}
                        className="text-xs font-medium text-gray-500 hover:text-[#0d1b3e] transition"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/factures/client/${client.id}`)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition"
                      >
                        Factures
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="text-xs font-medium text-red-400 hover:text-red-600 transition"
                      >
                        Supprimer
                      </button>
                    </div>
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
