import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export default function PlanComptable() {
  const [comptes, setComptes] = useState([]);
  const [form, setForm] = useState({ numero: "", intitule: "", type: "revenu" });
  const [editingId, setEditingId] = useState(null);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    const fetchComptes = async () => {
      const q = query(collection(db, "comptes_comptables"), where("uid", "==", uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setComptes(data);
    };
    if (uid) fetchComptes();
  }, [uid]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uid) return;

    if (editingId) {
      await updateDoc(doc(db, "comptes_comptables", editingId), form);
    } else {
      await addDoc(collection(db, "comptes_comptables"), {
        ...form,
        uid,
      });
    }
    setForm({ numero: "", intitule: "", type: "revenu" });
    setEditingId(null);
    const q = query(collection(db, "comptes_comptables"), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setComptes(data);
  };

  const handleEdit = (compte) => {
    setForm({ numero: compte.numero, intitule: compte.intitule, type: compte.type });
    setEditingId(compte.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce compte ?")) return;
    await deleteDoc(doc(db, "comptes_comptables", id));
    setComptes(comptes.filter((c) => c.id !== id));
  };

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📚 Plan Comptable</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow space-y-4 mb-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <input
            name="numero"
            value={form.numero}
            onChange={handleChange}
            required
            placeholder="Numéro de compte (ex: 701)"
            className="p-2 border rounded"
          />
          <input
            name="intitule"
            value={form.intitule}
            onChange={handleChange}
            required
            placeholder="Intitulé"
            className="p-2 border rounded"
          />
        </div>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="revenu">Revenu</option>
          <option value="dépense">Dépense</option>
          <option value="TVA">TVA</option>
        </select>

        <button type="submit" className="bg-[#1B5E20] text-white p-2 rounded">
          💾 {editingId ? "Modifier" : "Ajouter"} le compte
        </button>
      </form>

      <table className="w-full bg-white shadow rounded">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 text-left">Numéro</th>
            <th className="p-2 text-left">Intitulé</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {comptes.map((compte) => (
            <tr key={compte.id} className="border-t">
              <td className="p-2">{compte.numero}</td>
              <td className="p-2">{compte.intitule}</td>
              <td className="p-2 capitalize">{compte.type}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => handleEdit(compte)}
                  className="text-blue-600 hover:underline"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(compte.id)}
                  className="text-red-600 hover:underline"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}