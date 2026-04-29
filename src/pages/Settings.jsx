import { useEffect, useState } from "react";
import { auth, db, storage } from "../lib/firebase";
import { doc, getDoc, setDoc, query, where, collection, getDocs, writeBatch } from "firebase/firestore";
import { EmailAuthProvider, sendPasswordResetEmail, reauthenticateWithCredential, deleteUser } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { deleteDoc } from "firebase/firestore";

export default function Settings() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [entrepriseForm, setEntrepriseForm] = useState({ nom: "", siret: "", logo: "", tvaActive: true });
  const [userForm, setUserForm] = useState({ email: user?.email || "", notifications: true, theme: "clair" });
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
        const entSnap = await getDoc(doc(db, "entreprises", entrepriseId));
        if (entSnap.exists()) setEntrepriseForm(entSnap.data());
      }
      setUserForm(prev => ({ ...prev, notifications: userData?.notifications ?? true, theme: userData?.theme || "clair" }));
    };
    fetchData();
  }, [user]);

  const handleEntrepriseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEntrepriseForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const userSnap = await getDocs(query(collection(db, "utilisateurs"), where("uid", "==", user.uid)));
      const userData = userSnap.docs[0]?.data();
      const entrepriseId = userData?.entrepriseId;
      if (logoFile && entrepriseId) {
        const storageRef = ref(storage, `logos/${entrepriseId}.png`);
        await uploadBytes(storageRef, logoFile);
        entrepriseForm.logo = await getDownloadURL(storageRef);
      }
      if (entrepriseId && isAdmin) {
        await setDoc(doc(db, "entreprises", entrepriseId), entrepriseForm, { merge: true });
      }
      await setDoc(doc(db, "utilisateurs", userSnap.docs[0].id), userForm, { merge: true });
      alert("Paramètres enregistrés.");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    await sendPasswordResetEmail(auth, user.email);
    alert("Email de réinitialisation envoyé.");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Cette action est irréversible. Supprimer votre compte ?")) return;
    const password = prompt("Entrez votre mot de passe pour confirmer :");
    if (!password) return;
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      const userRef = doc(db, "utilisateurs", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      const entrepriseId = userData?.entrepriseId;
      if (userData?.role === "admin") {
        const batch = writeBatch(db);
        for (const colName of ["factures", "depenses", "clients", "membres", "categories"]) {
          const colSnap = await getDocs(collection(db, "entreprises", entrepriseId, colName));
          colSnap.forEach((d) => batch.delete(doc(db, "entreprises", entrepriseId, colName, d.id)));
        }
        batch.delete(doc(db, "entreprises", entrepriseId));
        batch.delete(userRef);
        await batch.commit();
      } else {
        await deleteDoc(userRef);
        await deleteDoc(doc(db, "entreprises", entrepriseId, "membres", user.uid));
      }
      await deleteUser(user);
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Erreur : " + err.message);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <main className="max-w-xl">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Paramètres</h2>

      {isAdmin && (
        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
          <h3 className="text-sm font-bold text-[#0d1b3e] mb-4">Entreprise</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Nom de l'entreprise</label>
              <input type="text" name="nom" value={entrepriseForm.nom} onChange={handleEntrepriseChange} placeholder="Nom de l'entreprise" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Numéro SIRET</label>
              <input type="text" name="siret" value={entrepriseForm.siret} onChange={handleEntrepriseChange} placeholder="123 456 789 00012" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Logo</label>
              {entrepriseForm.logo && (
                <img src={entrepriseForm.logo} alt="logo" className="h-16 object-contain border border-gray-100 rounded-xl mb-3" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="tvaActive" checked={entrepriseForm.tvaActive} onChange={handleEntrepriseChange} className="w-4 h-4 accent-emerald-600" />
              <span className="text-sm text-gray-700">Activer la gestion de la TVA</span>
            </label>
          </div>
        </section>
      )}

      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h3 className="text-sm font-bold text-[#0d1b3e] mb-4">Mon compte</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
            <input type="email" value={userForm.email} disabled className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="notifications" checked={userForm.notifications} onChange={handleUserChange} className="w-4 h-4 accent-emerald-600" />
            <span className="text-sm text-gray-700">Recevoir des notifications par email</span>
          </label>
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h3 className="text-sm font-bold text-[#0d1b3e] mb-4">Sécurité</h3>
        <button
          onClick={handleResetPassword}
          className="w-full border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-xl transition text-sm"
        >
          Réinitialiser le mot de passe par email
        </button>
      </section>

      <section className="bg-white border border-red-100 rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-bold text-red-600 mb-2">Zone dangereuse</h3>
        <p className="text-xs text-gray-400 mb-4">La suppression du compte est irréversible et efface toutes vos données.</p>
        <button
          onClick={handleDeleteAccount}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition text-sm"
        >
          Supprimer mon compte
        </button>
      </section>
    </main>
  );
}
