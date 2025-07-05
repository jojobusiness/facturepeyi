import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import InvoicePDF from "../components/InvoicePDF"; // ton composant d'affichage
import { downloadInvoicePDF } from "../utils/downloadPDF";

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null); // ← nécessaire pour le PDF
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Supprimer cette facture ?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "factures", id));
      setInvoices(invoices.filter(inv => inv.id !== id));
    } catch (err) {
      console.error("Erreur suppression :", err);
      alert("Erreur lors de la suppression.");
    }
  };

  const handleEdit = (id) => {
    navigate(`/facture/modifier/${id}`);
  };

  const handleGeneratePDF = (invoice) => {
    downloadInvoicePDF(invoice);
  };

  // 📄 Une fois que selectedInvoice est défini, on attend que le DOM le rende
  useEffect(() => {
    if (!selectedInvoice) return;

    const generate = async () => {
      // ⏳ attend que l'élément apparaisse dans le DOM
      await new Promise((resolve) => setTimeout(resolve, 300));

      const element = document.getElementById("invoice-pdf");

      if (!element) {
        alert("Erreur : élément PDF introuvable.");
        setSelectedInvoice(null);
        return;
      }

      try {
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save(`facture-${selectedInvoice.id}.pdf`);
      } catch (err) {
        console.error("Erreur génération PDF :", err);
      } finally {
        setSelectedInvoice(null);
      }
    };

    generate();
  }, [selectedInvoice]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const q = query(collection(db, "factures"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInvoices(data);
      } catch (err) {
        console.error("Erreur lors de la récupération :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  if (loading) return <p className="p-4">Chargement des factures...</p>;

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
            {invoices.map(invoice => (
              <tr key={invoice.id} className="border-t">
                <td className="p-2">{invoice.clientNom || "—"}</td>
                <td className="p-2">{invoice.description}</td>
                <td className="p-2">{invoice.amount} €</td>
                <td className="p-2">{invoice.date?.toDate().toLocaleDateString()}</td>
                <td className="p-2 capitalize">{invoice.status}</td>
                <td className="p-2 space-x-2">
                  <button onClick={() => handleEdit(invoice.id)} className="text-blue-600 hover:underline">Modifier</button>
                  <button onClick={() => handleDelete(invoice.id)} className="text-red-600 hover:underline">Supprimer</button>
                  <button onClick={() => handleGeneratePDF(invoice)} className="text-green-700 hover:underline">PDF</button>
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

      {/* 👇 élément caché à capturer en PDF */}
      {selectedInvoice && (
        <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
          <InvoicePDF invoice={selectedInvoice} />
        </div>
      )}
    </main>
  );
}