import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function DepenseList() {
  const [depenses, setDepenses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, "depenses"), orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDepenses(data);
    };
    fetch();
  }, []);

  const handleDelete = async (id) => {
    if (confirm("Supprimer cette dépense ?")) {
      await deleteDoc(doc(db, "depenses", id));
      setDepenses(depenses.filter(d => d.id !== id));
    }
  };

  return (
    <main className="p-4">
      <h2 className="text-2xl font-bold mb-4">💸 Liste des dépenses</h2>
      <table className="w-full bg-white shadow rounded">
        <thead className="bg-[#1B5E20] text-white">
          <tr>
            <th className="p-2 text-left">Fournisseur</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-left">Montant</th>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {depenses.map(dep => (
            <tr key={dep.id} className="border-t">
              <td className="p-2">{dep.fournisseur}</td>
              <td className="p-2">{dep.description}</td>
              <td className="p-2">{dep.montant} €</td>
              <td className="p-2">{dep.date?.toDate().toLocaleDateString()}</td>
              <td className="p-2 space-x-2">
                <button className="text-red-600 hover:underline" onClick={() => handleDelete(dep.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 space-x-2">
        <button onClick={() => navigate("/depenses/nouvelle")} className="bg-[#1B5E20] text-white px-4 py-2 rounded">➕ Nouvelle dépense</button>
        <button onClick={() => navigate("/depenses/import")} className="bg-blue-600 text-white px-4 py-2 rounded">📥 Importer</button>
      </div>
      <button onClick={() => navigate("/dashboard")} className="mb-4 px-4 py-2 bg-[#1B5E20] text-white rounded hover:bg-green-800">
      ← Retour au tableau de bord
      </button>
    </main>
  );
}