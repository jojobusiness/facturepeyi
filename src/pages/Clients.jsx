import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  deleteDoc,
  doc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";

export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce client ?")) return;

    const uid = auth.currentUser?.uid;
    if (!uid) return alert("Utilisateur non connecté");

    const userDoc = await getDoc(doc(db, "utilisateurs", uid));
    if (!userDoc.exists()) return alert("Utilisateur introuvable");

    const entrepriseId = userDoc.data().entrepriseId;
    if (!entrepriseId) return alert("Entreprise non trouvée");

    await deleteDoc(doc(db, "entreprises", entrepriseId, "clients", id));
    setClients(clients.filter((c) => c.id !== id));
  };

  const handleEdit = (id) => navigate(`/dashboard/clients/modifier/${id}`);

  useEffect(() => {
    const fetchClients = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userDoc = await getDoc(doc(db, "utilisateurs", uid));
      if (!userDoc.exists()) return alert("Utilisateur introuvable");

      const entrepriseId = userDoc.data().entrepriseId;
      if (!entrepriseId) return alert("Entreprise non trouvée");

      const q = query(
        collection(db, "entreprises", entrepriseId, "clients"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchClients();
  }, []);

  if (loading) return <p className="p-4">Chargement...</p>;

  return (
    <main className="p-4 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Mes Clients</h2>
      <button
        onClick={() => navigate("/dashboard/clients/ajouter")}
        className="bg-[#1B5E20] text-white px-4 py-2 rounded mb-4"
      >
        Ajouter un client
      </button>

      {clients.length === 0 ? (
        <p>Aucun client.</p>
      ) : (
        <table className="w-full bg-white rounded shadow">
          <thead className="bg-[#1B5E20] text-white">
            <tr>
              <th className="text-left p-2">Nom</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Téléphone</th>
              <th className="text-left p-2">Adresse</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-t">
                <td className="p-2">{client.nom}</td>
                <td className="p-2">{client.email}</td>
                <td className="p-2">{client.tel}</td>
                <td className="p-2">{client.adresse}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => handleEdit(client.id)}
                    className="text-blue-600 hover:underline"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/factures/client/${client.id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    Voir factures
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        onClick={() => navigate("/dashboard")}
        className="mt-6 px-4 py-2 bg-[#1B5E20] text-white rounded hover:bg-green-800"
      >
        ← Retour au tableau de bord
      </button>
    </main>
  );
}