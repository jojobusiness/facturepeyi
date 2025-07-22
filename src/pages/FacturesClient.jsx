import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export default function FacturesClient() {
  const { clientId } = useParams();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFactures = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error("Utilisateur non connecté");

        // ✅ Récupérer l'entrepriseId de l'utilisateur
        const userSnap = await getDoc(doc(db, "utilisateurs", uid));
        const userData = userSnap.data();
        const entrepriseId = userData?.entrepriseId;
        if (!entrepriseId) throw new Error("Entreprise non trouvée");

        // ✅ Requête sur les factures liées au client dans l'entreprise
        const q = query(
          collection(db, "entreprises", entrepriseId, "factures"),
          where("clientId", "==", clientId)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFactures(data);
      } catch (err) {
        console.error("Erreur :", err);
        alert("Erreur chargement factures.");
      } finally {
        setLoading(false);
      }
    };

    fetchFactures();
  }, [clientId]);

  if (loading) return <p className="p-4">Chargement...</p>;

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-6">Factures du client</h2>

      {factures.length === 0 ? (
        <p>Aucune facture pour ce client.</p>
      ) : (
        <table className="w-full bg-white shadow rounded">
          <thead className="bg-[#1B5E20] text-white">
            <tr>
              <th className="text-left p-2">Description</th>
              <th className="text-left p-2">Montant</th>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {factures.map((facture) => (
              <tr key={facture.id} className="border-t">
                <td className="p-2">{facture.description}</td>
                <td className="p-2">{facture.totalTTC?.toFixed(2)} €</td>
                <td className="p-2">
                  {facture.date?.toDate().toLocaleDateString()}
                </td>
                <td className="p-2 capitalize">{facture.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        onClick={() => navigate("/dashboard/clients")}
        className="mt-6 px-4 py-2 bg-[#1B5E20] text-white rounded hover:bg-green-800"
      >
        ← Retour à la liste des clients
      </button>
    </main>
  );
}