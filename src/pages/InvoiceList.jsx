import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { downloadInvoicePDF } from "../utils/downloadPDF";

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const navigate = useNavigate();

  // ✅ Récupérer l'entrepriseId de l'utilisateur connecté
  useEffect(() => {
    const fetchEntreprise = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const userSnap = await getDoc(doc(db, "utilisateurs", uid));
      const data = userSnap.data();
      setEntrepriseId(data?.entrepriseId || null);
    };
    fetchEntreprise();
  }, []);

  // ✅ Charger les factures de cette entreprise
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!entrepriseId) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "entreprises", entrepriseId, "factures"),
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
  }, [entrepriseId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette facture ?")) return;
    await deleteDoc(doc(db, "entreprises", entrepriseId, "factures", id));
    setInvoices(invoices.filter((inv) => inv.id !== id));
  };

  const handleEdit = (id) => {
    navigate(`/facture/modifier/${id}`);
  };

  const handleGeneratePDF = async (invoice) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !entrepriseId) return alert("Utilisateur non connecté");

    try {
      const snap = await getDoc(doc(db, "entreprises", entrepriseId));
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