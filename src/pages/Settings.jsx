import { useEffect, useState } from "react";
import { auth, db, storage } from "../lib/firebase";
import { doc, getDoc, setDoc, query, where, collection, getDocs } from "firebase/firestore";
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
  const [entrepriseForm, setEntrepriseForm] = useState({
    nom: "",
    siret: "",
    logo: "",
    tvaActive: true,
  });
  const [userForm, setUserForm] = useState({
    email: user?.email || "",
    notifications: true,
    theme: "clair",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const userSnap = await getDocs(query(collection(db, "utilisateurs"), where("uid", "==", user.uid)));
      const userData = userSnap.docs[0]?.data();
      const entrepriseId = userData?.entrepriseId;
      setIsAdmin(userData?.role === "admin");

      if (entrepriseId) {
        const entRef = doc(db, "entreprises", entrepriseId);
        const entSnap = await getDoc(entRef);
        if (entSnap.exists()) {
          setEntrepriseForm(entSnap.data());
        }
      }

      setUserForm(prev => ({
        ...prev,
        notifications: userData?.notifications ?? true,
        theme: userData?.theme || "clair",
      }));
    };

    fetchData();
  }, [user]);

  const handleEntrepriseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEntrepriseForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
      const userData = userSnap.docs[0]?.data();
      const entrepriseId = userData?.entrepriseId;

      if (logoFile && entrepriseId) {
        const storageRef = ref(storage, `logos/${entrepriseId}.png`);
        await uploadBytes(storageRef, logoFile);
        const logoURL = await getDownloadURL(storageRef);
        entrepriseForm.logo = logoURL;
      }

      if (entrepriseId && isAdmin) {
        await setDoc(doc(db, "entreprises", entrepriseId), entrepriseForm, { merge: true });
      }

      await setDoc(doc(db, "users", userSnap.docs[0].id), userForm, { merge: true });
      alert("✅ Paramètres enregistrés.");
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
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
      <h2 className="text-2xl font-bold mb-6">⚙️ Paramètres</h2>

      {isAdmin && (
        <section className="bg-white p-4 rounded shadow max-w-xl mb-8">
          <h3 className="text-xl font-semibold mb-4">🏢 Paramètres de l'entreprise</h3>
          <input
            type="text"
            name="nom"
            value={entrepriseForm.nom}
            onChange={handleEntrepriseChange}
            placeholder="Nom de l'entreprise"
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            name="siret"
            value={entrepriseForm.siret}
            onChange={handleEntrepriseChange}
            placeholder="Numéro SIRET"
            className="w-full p-2 border rounded mb-2"
          />
          <label className="block mb-2">Logo :</label>
          {entrepriseForm.logo && (
            <img src={entrepriseForm.logo} alt="logo" className="h-20 object-contain border mb-2" />
          )}
          <input type="file" onChange={(e) => setLogoFile(e.target.files[0])} className="mb-4" />
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              name="tvaActive"
              checked={entrepriseForm.tvaActive}
              onChange={handleEntrepriseChange}
            />
            Activer la gestion de la TVA
          </label>
        </section>
      )}

      <section className="bg-white p-4 rounded shadow max-w-xl mb-8">
        <h3 className="text-xl font-semibold mb-4">👤 Mon compte</h3>
        <input
          type="email"
          name="email"
          value={userForm.email}
          disabled
          className="w-full p-2 border rounded mb-2"
        />
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            name="notifications"
            checked={userForm.notifications}
            onChange={handleUserChange}
          />
          Recevoir des notifications
        </label>
        <select
          name="theme"
          value={userForm.theme}
          onChange={handleUserChange}
          className="w-full p-2 border rounded mb-4"
        >
          <option value="clair">Thème clair</option>
          <option value="sombre">Thème sombre</option>
        </select>
        <button
          onClick={handleSave}
          className="bg-[#1B5E20] text-white w-full p-2 rounded"
        >
          {loading ? "Enregistrement..." : "💾 Enregistrer"}
        </button>
      </section>

      <section className="bg-white p-4 rounded shadow max-w-xl mb-8">
        <h3 className="text-xl font-semibold">🔐 Sécurité</h3>
        <button
          onClick={handleResetPassword}
          className="bg-yellow-500 text-white w-full p-2 rounded hover:bg-yellow-600 mt-2"
        >
          📧 Réinitialiser le mot de passe par email
        </button>
      </section>

      <section className="bg-white p-4 rounded shadow max-w-xl mb-8">
        <h3 className="text-xl font-semibold text-red-600">🗑️ Supprimer le compte</h3>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-600 text-white w-full p-2 rounded hover:bg-red-700 mt-2"
        >
          Supprimer mon compte
        </button>
      </section>

      <button
        onClick={() => navigate("/dashboard")}
        className="mt-6 px-4 py-2 bg-[#1B5E20] text-white rounded hover:bg-green-800"
      >
        ← Retour au tableau de bord
      </button>
    </main>
  );
}