import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  getDoc,
} from "firebase/firestore";
import { SketchPicker } from "react-color";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ nom: "", couleur: "#1B5E20" });
  const [entrepriseId, setEntrepriseId] = useState(null);

  // 🔍 Récupère entrepriseId lié à l'utilisateur
  useEffect(() => {
    const fetchEntrepriseId = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "utilisateurs", user.uid));
      if (userDoc.exists()) {
        setEntrepriseId(userDoc.data().entrepriseId);
      }
    };

    fetchEntrepriseId();
  }, []);

  // 📥 Récupère les catégories de l'entreprise
  const fetchCategories = async () => {
    if (!entrepriseId) return;

    const q = query(collection(db, "entreprises", entrepriseId, "categories"));
    const querySnapshot = await getDocs(q);
    const result = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setCategories(result);
  };

  // ➕ Ajouter une catégorie dans l'entreprise
  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.nom.trim()) return alert("⚠️ Nom requis !");
    if (!entrepriseId) return alert("Entreprise introuvable");

    await addDoc(collection(db, "entreprises", entrepriseId, "categories"), {
      ...newCategory,
    });

    setNewCategory({ nom: "", couleur: "#1B5E20" });
    fetchCategories();
  };

  // ❌ Supprimer une catégorie de l'entreprise
  const deleteCategory = async (id) => {
    if (!entrepriseId) return;
    if (confirm("Supprimer cette catégorie ?")) {
      await deleteDoc(doc(db, "entreprises", entrepriseId, "categories", id));
      fetchCategories();
    }
  };

  useEffect(() => {
    if (entrepriseId) fetchCategories();
  }, [entrepriseId]);

  return (
    <main className="min-h-screen p-6 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">📂 Catégories de dépenses</h2>

      <form onSubmit={addCategory} className="bg-white p-4 rounded shadow space-y-4 max-w-md">
        <input
          type="text"
          value={newCategory.nom}
          onChange={(e) =>
            setNewCategory({ ...newCategory, nom: e.target.value })
          }
          placeholder="Nom de la catégorie"
          className="w-full p-2 border rounded"
        />
        <SketchPicker
          color={newCategory.couleur}
          onChangeComplete={(color) =>
            setNewCategory({ ...newCategory, couleur: color.hex })
          }
        />
        <button type="submit" className="bg-[#1B5E20] text-white p-2 w-full rounded">
          ➕ Ajouter la catégorie
        </button>
      </form>

      <ul className="mt-6 space-y-2">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex items-center justify-between bg-white p-3 rounded shadow"
          >
            <span className="flex items-center space-x-2">
              <span
                className="w-4 h-4 rounded-full inline-block"
                style={{ backgroundColor: cat.couleur }}
              ></span>
              <span>{cat.nom}</span>
            </span>
            <button
              onClick={() => deleteCategory(cat.id)}
              className="text-red-600 hover:underline"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}