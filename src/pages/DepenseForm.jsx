import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

export default function DepenseForm() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    fournisseur: "",
    description: "",
    montant: "",
    date: "",
    categorieId: "",
  });

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const fetchCategories = async () => {
      const q = query(collection(db, "categories"), where("uid", "==", uid));
      const snap = await getDocs(q);
      setCategories(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchCategories();
  }, [uid]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "depenses"), {
        ...formData,
        uid,
        montant: parseFloat(formData.montant),
        date: Timestamp.fromDate(new Date(formData.date)),
        createdAt: Timestamp.now(),
      });
      navigate("/depenses");
    } catch (err) {
      alert("Erreur lors de l'enregistrement de la dépense.");
      console.error(err);
    }
  };

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Ajouter une dépense</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-4 rounded shadow"
      >
        <input
          name="fournisseur"
          onChange={handleChange}
          required
          placeholder="Fournisseur"
          className="w-full p-2 border rounded"
        />
        <input
          name="description"
          onChange={handleChange}
          required
          placeholder="Description"
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          name="montant"
          onChange={handleChange}
          required
          placeholder="Montant (€)"
          className="w-full p-2 border rounded"
        />
        <input
          type="date"
          name="date"
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />

        {/* Select catégorie */}
        <select
          name="categorieId"
          onChange={handleChange}
          required
          value={formData.categorieId}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Choisir une catégorie --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nom}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-[#1B5E20] text-white px-4 py-2 rounded"
        >
          💾 Enregistrer
        </button>
      </form>

      <button
        onClick={() => navigate("/depenses")}
        className="mt-4 text-blue-600 underline"
      >
        ← Retour à la liste
      </button>
    </main>
  );
}