import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, deleteDoc, doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { downloadInvoicePDF } from "../utils/downloadPDF";
import { useAuth } from "../context/AuthContext";

const STATUS_CONFIG = {
  "en attente": { label: "En attente", classes: "bg-yellow-50 text-yellow-700" },
  "payée":      { label: "Payée",      classes: "bg-emerald-50 text-emerald-700" },
  "en retard":  { label: "En retard",  classes: "bg-red-50 text-red-600" },
  "annulée":    { label: "Annulée",    classes: "bg-gray-100 text-gray-500" },
};

export default function InvoiceList() {
  const { entrepriseId } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!entrepriseId) return;
    const q = query(collection(db, "entreprises", entrepriseId, "factures"), orderBy("createdAt", "desc"));
    getDocs(q).then((snap) => {
      setInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [entrepriseId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette facture ?")) return;
    await deleteDoc(doc(db, "entreprises", entrepriseId, "factures", id));
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  const handleGeneratePDF = async (invoice) => {
    if (!entrepriseId) return;
    try {
      const snap = await getDoc(doc(db, "entreprises", entrepriseId));
      const entreprise = snap.exists() ? snap.data() : {};
      const logoUrl = entreprise.logo || "";
      let logoDataUrl = "";
      if (logoUrl) {
        const proxyUrl = "https://facturepeyi.vercel.app/api/logo-proxy?url=" + encodeURIComponent(logoUrl);
        const res = await fetch(proxyUrl);
        logoDataUrl = await res.text();
      }
      let clientData = {};
      if (invoice.clientId) {
        const clientSnap = await getDoc(doc(db, "entreprises", entrepriseId, "clients", invoice.clientId));
        if (clientSnap.exists()) clientData = clientSnap.data();
      }
      await downloadInvoicePDF({
        ...invoice,
        clientNom: clientData.nom || invoice.clientNom || "Client inconnu",
        clientAdresse: clientData.adresse || "",
        clientEmail: clientData.email || "",
        entrepriseNom: entreprise.nom || "Nom Entreprise",
        entrepriseSiret: entreprise.siret || "SIRET inconnu",
        entrepriseAdresse: entreprise.adresse || "",
        logoDataUrl,
      });
    } catch (err) {
      console.error(err);
      alert("Erreur chargement des données pour le PDF.");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement...</div>;

  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d1b3e]">Factures</h2>
          <p className="text-sm text-gray-400 mt-0.5">{invoices.length} facture{invoices.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          to="/dashboard/facture/nouvelle"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition"
        >
          + Nouvelle facture
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">🧾</div>
          <p className="text-gray-500 font-medium">Aucune facture pour l'instant</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">Créez votre première facture en quelques clics</p>
          <Link to="/dashboard/facture/nouvelle" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition">
            Créer une facture
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
              {invoices.map((invoice) => {
                const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG["en attente"];
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-[#0d1b3e]">{invoice.clientNom || "—"}</td>
                    <td className="px-5 py-4 text-gray-500 max-w-xs truncate hidden md:table-cell">{invoice.description}</td>
                    <td className="px-5 py-4 font-semibold text-[#0d1b3e]">{invoice.totalTTC?.toFixed(2)} €</td>
                    <td className="px-5 py-4 text-gray-400 hidden sm:table-cell">
                      {invoice.date?.toDate().toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.classes}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => navigate(`/dashboard/facture/modifier/${invoice.id}`)}
                          className="text-xs font-medium text-gray-500 hover:text-[#0d1b3e] transition"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleGeneratePDF(invoice)}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
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
