import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { downloadInvoicePDF } from "../utils/downloadPDF";

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette facture ?")) return;
    await deleteDoc(doc(db, "factures", id));
    setInvoices(invoices.filter((inv) => inv.id !== id));
  };

  const handleEdit = (id) => {
    navigate(`/facture/modifier/${id}`);
  };

  const handleGeneratePDF = async (invoice) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return alert("Utilisateur non connecté");

    try {
      const entrepriseRef = doc(db, "entreprises", userId);
      const snap = await getDoc(entrepriseRef);
      const entreprise = snap.exists() ? snap.data() : {};

      const fullInvoice = {
        ...invoice,
        entrepriseNom: entreprise.nom || "Nom Entreprise",
        entrepriseEmail: entreprise.email || "email@entreprise.com",
        entrepriseSiret: entreprise.siret || "SIRET inconnu",
        logoUrl: entreprise.logoUrl || "",
      };

      await downloadInvoicePDF(fullInvoice);
    } catch (err) {
      console.error("Erreur récupération entreprise :", err);
      alert("Erreur chargement entreprise.");
    }
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "factures"),
        where("uid", "==", userId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setInvoices(data);
      setLoading(false);
    };

    fetchInvoices();
  }, []);

  if (loading) return <p className="p-4">Chargement...</p>;

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-6">Mes Factures</h2>

      {invoices.length === 0 ? (
        <p>Aucune facture enregistrée.</p>
      ) : (
        <table className="w-full bg-white shadow rounded">
          <thead className="bg-[#1B5E20] text-white">
            <tr>
              <th className="text-left p-2">Client</th>
              <th className="text-left p-2">Description</th>
              <th className="text-left p-2">Montant</th>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Statut</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t">
                <td className="p-2">{invoice.clientNom || "—"}</td>
                <td className="p-2">{invoice.description}</td>
                <td className="p-2">{invoice.totalTTC} €</td>
                <td className="p-2">
                  {invoice.date?.toDate().toLocaleDateString()}
                </td>
                <td className="p-2 capitalize">{invoice.status}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => handleEdit(invoice.id)}
                    className="text-blue-600 hover:underline"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(invoice.id)}
                    className="text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                  <button
                    onClick={() => handleGeneratePDF(invoice)}
                    className="text-green-700 hover:underline"
                  >
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        onClick={() => navigate("/dashboard")}
        className="mt-4 px-4 py-2 bg-[#1B5E20] text-white rounded hover:bg-green-800"
      >
        ← Retour au tableau de bord
      </button>
    </main>
  );
}