import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function ClientDetails() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer le client
        const clientSnap = await getDoc(doc(db, "clients", id));
        if (!clientSnap.exists()) throw new Error("Client introuvable");

        setClient({ id: clientSnap.id, ...clientSnap.data() });

        // Récupérer ses factures
        const q = query(collection(db, "factures"), where("clientId", "==", id));
        const factureSnap = await getDocs(q);
        const factureList = factureSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setFactures(factureList);
      } catch (err) {
        console.error("Erreur : ", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <p className="p-4">Chargement...</p>;
  if (!client) return <p className="p-4">Client non trouvé.</p>;

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-4">Détail du client</h2>

      <div className="bg-white p-4 rounded shadow mb-6">
        <p><strong>Nom :</strong> {client.nom}</p>
        <p><strong>Email :</strong> {client.email}</p>
        <p><strong>Entreprise :</strong> {client.entreprise}</p>
      </div>

      <h3 className="text-xl font-semibold mb-2">Factures associées</h3>

      {factures.length === 0 ? (
        <p>Aucune facture pour ce client.</p>
      ) : (
        <table className="w-full bg-white shadow rounded">
          <thead className="bg-[#1B5E20] text-white">
            <tr>
              <th className="text-left p-2">Description</th>
              <th className="text-left p-2">Montant</th>
              <th className="text-left p-2">Statut</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {factures.map(facture => (
              <tr key={facture.id} className="border-t">
                <td className="p-2">{facture.description}</td>
                <td className="p-2">{facture.amount} €</td>
                <td className="p-2 capitalize">{facture.status}</td>
                <td className="p-2">
                  <Link to={`/facture/modifier/${facture.id}`} className="text-blue-600 hover:underline">
                    Modifier
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}