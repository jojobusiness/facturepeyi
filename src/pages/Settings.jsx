import { useEffect, useState } from "react";
import { auth, db, storage } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  sendPasswordResetEmail,
  deleteUser,
} from "firebase/auth";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [form, setForm] = useState({
    nom: "",
    email: user?.email || "",
    siret: "",
    logo: "",
    notifications: true,
    theme: "clair",
    role: "",
  });

  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "entreprises", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setForm((prev) => ({ ...prev, ...docSnap.data() }));
      }
    };
    if (user) fetchData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return null;

    const storageRef = ref(storage, `logos/${user.uid}`);
    await uploadBytes(storageRef, logoFile);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let logoURL = form.logo;

      if (logoFile) {
        logoURL = await handleLogoUpload();
      }

      const docRef = doc(db, "entreprises", user.uid);
      await updateDoc(docRef, { ...form, logo: logoURL });

      alert("✅ Paramètres enregistrés.");
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de l'enregistrement.");
    }
  };

  const handleResetPassword = async () => {
    await sendPasswordResetEmail(auth, user.email);
    alert("📧 Email de réinitialisation envoyé.");
  };

  const handleDeleteAccount = async () => {
    if (confirm("Supprimer définitivement ton compte ?")) {
      await deleteUser(user);
      alert("✅ Compte supprimé.");
      navigate("/");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-4">⚙️ Paramètres</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow max-w-xl space-y-4"
      >
        <input
          type="text"
          name="nom"
          value={form.nom}
          onChange={handleChange}
          placeholder="Nom de l'entreprise"
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-2 border rounded"
          disabled
        />
        <input
          type="text"
          name="siret"
          value={form.siret}
          onChange={handleChange}
          placeholder="Numéro SIRET"
          className="w-full p-2 border rounded"
        />

        {/* Upload de logo */}
        <div className="space-y-2">
          <label className="block font-medium">Logo de l’entreprise :</label>
          {form.logo && (
            <img
              src={form.logo}
              alt="Logo actuel"
              className="h-20 object-contain rounded border"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files[0])}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="notifications"
            checked={form.notifications}
            onChange={handleChange}
          />
          <label htmlFor="notifications">Recevoir des notifications</label>
        </div>

        <select
          name="theme"
          value={form.theme}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="clair">Thème clair</option>
          <option value="sombre">Thème sombre</option>
        </select>

        <input
          type="text"
          name="role"
          value={form.role}
          disabled
          className="w-full p-2 border rounded bg-gray-100 text-gray-700"
          placeholder="Rôle (admin / comptable)"
        />

        <button
          type="submit"
          className="bg-[#1B5E20] text-white w-full p-2 rounded"
        >
          💾 Enregistrer
        </button>
      </form>

      {/* Mot de passe */}
      <div className="mt-8 bg-white p-4 rounded shadow max-w-xl space-y-4">
        <h3 className="text-xl font-semibold">🔐 Sécurité</h3>
        <p>Pour changer votre mot de passe, cliquez ci-dessous pour recevoir un lien sécurisé par email.</p>
        <button
          onClick={handleResetPassword}
          className="bg-yellow-500 text-white w-full p-2 rounded hover:bg-yellow-600"
        >
          📧 Réinitialiser le mot de passe par email
        </button>
      </div>

      {/* Suppression */}
      <div className="mt-8 bg-white p-4 rounded shadow max-w-xl space-y-4">
        <h3 className="text-xl font-semibold text-red-600">🗑️ Supprimer le compte</h3>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-600 text-white w-full p-2 rounded hover:bg-red-700"
        >
          Supprimer mon compte
        </button>
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        className="mt-6 px-4 py-2 bg-[#1B5E20] text-white rounded hover:bg-green-800"
      >
        ← Retour au tableau de bord
      </button>
    </main>
  );
}