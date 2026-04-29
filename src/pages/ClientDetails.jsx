import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const STATUS_CONFIG = {
  "en attente": { label: "En attente", classes: "bg-yellow-50 text-yellow-700" },
  "payée":      { label: "Payée",      classes: "bg-emerald-50 text-emerald-700" },
  "en retard":  { label: "En retard",  classes: "bg-red-50 text-red-600" },
  "annulée":    { label: "Annulée",    classes: "bg-gray-100 text-gray-500" },
};

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default function ClientDetails() {
  const { id } = useParams();
  const { entrepriseId } = useAuth();
  const [client, setClient] = useState(null);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entrepriseId || !id) return;
    const fetchAll = async () => {
      try {
        const clientSnap = await getDoc(doc(db, "entreprises", entrepriseId, "clients", id));
        if (!clientSnap.exists()) { alert("Client introuvable"); return; }
        setClient({ id: clientSnap.id, ...clientSnap.data() });

        const q = query(collection(db, "entreprises", entrepriseId, "factures"), where("clientId", "==", id));
        const snap = await getDocs(q);
        setFactures(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        alert("Erreur chargement des données.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [entrepriseId, id]);

  const handleExportPDF = () => {
    const docPDF = new jsPDF();
    docPDF.text(`Factures de ${client.nom}`, 14, 20);
    autoTable(docPDF, {
      head: [["Description", "Montant TTC", "Statut"]],
      body: factures.map((f) => [f.description, `${(f.totalTTC || 0).toFixed(2)} €`, f.status]),
      startY: 30,
    });
    docPDF.save(`factures_${client.nom}.pdf`);
  };

  const total = factures.reduce((s, f) => s + Number(f.totalTTC || 0), 0);
  const totalPayé = factures.filter((f) => f.status === "payée").reduce((s, f) => s + Number(f.totalTTC || 0), 0);

  if (loading || !client) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement...</div>;

  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d1b3e]">{client.nom}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{factures.length} facture{factures.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/dashboard/facture/nouvelle?clientId=${client.id}`}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition"
          >
            + Nouvelle facture
          </Link>
          <button
            onClick={handleExportPDF}
            className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm px-4 py-2.5 rounded-xl transition"
          >
            PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Informations client</h3>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "Nom", val: client.nom },
            { label: "Email", val: client.email || "—" },
            { label: "Téléphone", val: client.telephone || "—" },
            { label: "Entreprise", val: client.entreprise || "—" },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-xs text-gray-400 mb-0.5">{item.label}</dt>
              <dd className="font-medium text-[#0d1b3e]">{item.val}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-gray-400 mb-1">Total facturé</div>
          <div className="text-lg font-extrabold text-[#0d1b3e]">{euro.format(total)}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-gray-400 mb-1">Total payé</div>
          <div className="text-lg font-extrabold text-emerald-600">{euro.format(totalPayé)}</div>
        </div>
      </div>

      {factures.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <p className="text-gray-500 font-medium">Aucune facture associée</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">Créez une première facture pour ce client</p>
          <Link to={`/dashboard/facture/nouvelle?clientId=${client.id}`} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition">
            Créer une facture
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Description", "Montant TTC", "Statut"].map((h) => (
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
