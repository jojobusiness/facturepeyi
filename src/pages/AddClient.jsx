import { useState, useEffect } from "react";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

export default function AddClient() {
  const [form, setForm] = useState({ nom: "", email: "", tel: "", adresse: "" });
  const [entrepriseId, setEntrepriseId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEntrepriseId = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userDoc = await getDoc(doc(db, "utilisateurs", uid));
      if (userDoc.exists()) {
        setEntrepriseId(userDoc.data().entrepriseId);
      }
    };
    fetchEntrepriseId();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!entrepriseId) {
      return alert("Entreprise introuvable.");
    }

    try {
      await addDoc(collection(db, "entreprises", entrepriseId, "clients"), {
        ...form,
        createdAt: serverTimestamp(),
        entrepriseId,
      });
      alert("Client ajouté !");
      navigate("/dashboard/clients");
    } catch (err) {
      console.error("Erreur ajout client :", err);
      alert("Erreur lors de l'ajout du client.");
    }
  };

  return (
    <main className="p-4 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Ajouter un client</h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow space-y-4 max-w-md"
      >
        <input
          type="text"
          name="nom"
          onChange={handleChange}
          value={form.nom}
          placeholder="Nom"
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          name="email"
          onChange={handleChange}
          value={form.email}
          placeholder="Email"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="tel"
          onChange={handleChange}
          value={form.tel}
          placeholder="Téléphone"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="adresse"
          onChange={handleChange}
          value={form.adresse}
          placeholder="Adresse"
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-[#1B5E20] text-white w-full p-2 rounded"
        >
          Ajouter
        </button>
      </form>
    </main>
  );
}