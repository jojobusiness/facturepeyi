import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export default function EditClient() {
  const { id } = useParams(); // id du client
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom: "",
    email: "",
    tel: "",
    adresse: "",
  });

  const [entrepriseId, setEntrepriseId] = useState(null);

  useEffect(() => {
    const fetchClient = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userDoc = await getDoc(doc(db, "utilisateurs", uid));
      const entrepriseId = userDoc.exists() ? userDoc.data().entrepriseId : null;
      setEntrepriseId(entrepriseId);

      if (!entrepriseId) return alert("Entreprise introuvable");

      const snap = await getDoc(doc(db, "entreprises", entrepriseId, "clients", id));
      if (snap.exists()) setForm(snap.data());
      else alert("Client introuvable");
    };

    fetchClient();
  }, [id]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entrepriseId) return alert("Entreprise non trouvée");
    await updateDoc(doc(db, "entreprises", entrepriseId, "clients", id), form);
    alert("Client modifié !");
    navigate("/dashboard/clients");
  };

  return (
    <main className="p-4 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Modifier le client</h2>
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
          Enregistrer
        </button>
      </form>
    </main>
  );
}