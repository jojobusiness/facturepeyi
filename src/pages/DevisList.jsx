import { useEffect, useState } from "react";
import {
  collection, getDocs, query, orderBy,
  deleteDoc, doc, addDoc, updateDoc, Timestamp,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

const STATUS_CONFIG = {
  brouillon: { label: "Brouillon", classes: "bg-gray-100 text-gray-600" },
  "envoyé":  { label: "Envoyé",    classes: "bg-blue-50 text-blue-700" },
  "accepté": { label: "Accepté",   classes: "bg-emerald-50 text-emerald-700" },
  "refusé":  { label: "Refusé",    classes: "bg-red-50 text-red-600" },
};

export default function DevisList() {
  const { entrepriseId } = useAuth();
  const navigate = useNavigate();
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entrepriseId) return;
    const q = query(
      collection(db, "entreprises", entrepriseId, "devis"),
      orderBy("createdAt", "desc")
    );
    getDocs(q).then((snap) => {
      setDevis(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [entrepriseId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce devis ?")) return;
    await deleteDoc(doc(db, "entreprises", entrepriseId, "devis", id));
    setDevis((prev) => prev.filter((d) => d.id !== id));
  };

  const handleConvert = async (devisItem) => {
    if (!window.confirm("Convertir ce devis en facture ?")) return;
    try {
      const ref = await addDoc(collection(db, "entreprises", entrepriseId, "factures"), {
        clientId: devisItem.clientId,
        clientNom: devisItem.clientNom,
        clientEmail: devisItem.clientEmail,
        description: devisItem.description,
        amountHT: devisItem.amountHT,
        tva: devisItem.tva,
        totalTTC: devisItem.totalTTC,
        tvaRate: devisItem.tvaRate,
        mentionLegale: devisItem.mentionLegale || "",
        date: Timestamp.now(),
        status: "en attente",
        createdAt: Timestamp.now(),
        entrepriseId,
        sourceDevisId: devisItem.id,
      });
      await updateDoc(doc(db, "entreprises", entrepriseId, "devis", devisItem.id), {
        convertedToFacture: true,
        factureId: ref.id,
        status: "accepté",
      });
      setDevis((prev) =>
        prev.map((d) =>
          d.id === devisItem.id
            ? { ...d, convertedToFacture: true, factureId: ref.id, status: "accepté" }
            : d
        )
      );
      navigate(`/dashboard/facture/modifier/${ref.id}`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la conversion.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Chargement...
      </div>
    );
  }

  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d1b3e]">Devis</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {devis.length} devis enregistré{devis.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/dashboard/devis/nouveau"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition"
        >
          + Nouveau devis
        </Link>
      </div>

      {devis.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-gray-500 font-medium">Aucun devis pour l'instant</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">
            Créez votre premier devis et convertissez-le en facture en un clic
          </p>
          <Link
            to="/dashboard/devis/nouveau"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition"
          >
            Créer un devis
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant TTC</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {devis.map((d) => {
                const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.brouillon;
                return (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-[#0d1b3e]">{d.clientNom || "—"}</td>
                    <td className="px-5 py-4 text-gray-500 max-w-xs truncate hidden md:table-cell">
                      {d.description}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#0d1b3e]">
                      {d.totalTTC?.toFixed(2)} €
                    </td>
                    <td className="px-5 py-4 text-gray-400 hidden sm:table-cell">
                      {d.date?.toDate().toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.classes}`}>
                        {cfg.label}
                      </span>
                      {d.convertedToFacture && (
                        <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
                          Converti
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => navigate(`/dashboard/devis/modifier/${d.id}`)}
                          className="text-xs font-medium text-gray-500 hover:text-[#0d1b3e] transition"
                        >
                          Modifier
                        </button>
                        {!d.convertedToFacture ? (
                          <button
                            onClick={() => handleConvert(d)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
                          >
                            → Facture
                          </button>
                        ) : (
                          d.factureId && (
                            <button
                              onClick={() => navigate(`/dashboard/facture/modifier/${d.factureId}`)}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition"
                            >
                              Voir facture
                            </button>
                          )
                        )}
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="text-xs font-medium text-red-400 hover:text-red-600 transition"
                        >
                          Supprimer
                        </button>
                      </div>
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
