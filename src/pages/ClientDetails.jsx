import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ClientDetails() {
  const { id } = useParams(); // id du client
  const [client, setClient] = useState(null);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Récupérer l'entreprise de l'utilisateur
  const getEntrepriseId = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return null;
    const snap = await getDoc(doc(db, "utilisateurs", uid));
    return snap.exists() ? snap.data().entrepriseId : null;
  };

  useEffect(() => {
    const fetchClientAndFactures = async () => {
      try {
        const entrepriseId = await getEntrepriseId();
        if (!entrepriseId) return alert("Entreprise non trouvée");

        // 🔹 1. Charger les infos du client
        const clientRef = doc(db, "entreprises", entrepriseId, "clients", id);
        const snap = await getDoc(clientRef);
        if (!snap.exists()) return alert("Client introuvable");
        setClient({ id: snap.id, ...snap.data() });

        // 🔹 2. Charger les factures du client
        const q = query(
          collection(db, "entreprises", entrepriseId, "factures"),
          where("clientId", "==", id)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFactures(data);
      } catch (err) {
        console.error("Erreur lors du chargement :", err);
        alert("Erreur chargement des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchClientAndFactures();
  }, [id]);

  const handleExportPDF = () => {
    const docPDF = new jsPDF();
    docPDF.text(`Factures de ${client.nom}`, 14, 20);

    const rows = factures.map((f) => [
      f.description,
      `${f.totalTTC || f.amount || 0} €`,
      f.status,
    ]);

    docPDF.autoTable({
      head: [["Description", "Montant", "Statut"]],
      body: rows,
      startY: 30,
    });

    docPDF.save(`factures_${client.nom}.pdf`);
  };

  const total = factures.reduce(
    (sum, f) => sum + Number(f.totalTTC || f.amount || 0),
    0
  );
  const totalPayé = factures
    .filter((f) => f.status === "payée")
    .reduce((sum, f) => sum + Number(f.totalTTC || f.amount || 0), 0);

  if (loading || !client) return <p className="p-4">Chargement...</p>;

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-4">Détails du client</h2>

      <div className="bg-white p-4 rounded shadow mb-6">
        <p><strong>Nom :</strong> {client.nom}</p>
        <p><strong>Email :</strong> {client.email}</p>
        <p><strong>Téléphone :</strong> {client.telephone}</p>
        <p><strong>Entreprise :</strong> {client.entreprise}</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Factures de ce client</h3>
        <div className="flex gap-2">
          <Link
            to={`/dashboard/facture/nouveau?clientId=${client.id}`}
            className="bg-[#1B5E20] text-white px-4 py-2 rounded shadow"
          >
            ➕ Nouvelle facture
          </Link>
          <button
            onClick={handleExportPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {factures.length === 0 ? (
        <p>Aucune facture associée.</p>
      ) : (
        <table className="w-full bg-white shadow rounded">
          <thead className="bg-[#1B5E20] text-white">
            <tr>
              <th className="text-left p-2">Description</th>
              <th className="text-left p-2">Montant</th>
              <th className="text-left p-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {factures.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-2">{f.description}</td>
                <td className="p-2">{f.totalTTC || f.amount || 0} €</td>
                <td className="p-2 capitalize">{f.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-4 p-4 bg-white rounded shadow text-sm">
        <p><strong>Total facturé :</strong> {total.toFixed(2)} €</p>
        <p><strong>Total payé :</strong> {totalPayé.toFixed(2)} €</p>
      </div>
    </main>
  );
}