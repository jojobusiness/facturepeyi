import { useEffect, useState } from "react";
import { auth, db, storage } from "../lib/firebase";
import { doc, setDoc, deleteDoc, writeBatch, collection, getDocs } from "firebase/firestore";
import { EmailAuthProvider, sendPasswordResetEmail, reauthenticateWithCredential, deleteUser } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { TERRITORIES, REGIMES, getTvaRate, getMentionLegale, hasOctroiDeMer } from "../lib/territories";

export default function Settings() {
  const navigate = useNavigate();
  const { entreprise, entrepriseId, refreshEntreprise } = useAuth();
  const user = auth.currentUser;
  const isAdmin = entreprise?.ownerUid === user?.uid;

  const [entrepriseForm, setEntrepriseForm] = useState({
    nom: "", siret: "", logo: "", tvaActive: true, territoire: "guyane", regime: "reel",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entreprise) return;
    setEntrepriseForm({
      nom: entreprise.nom || "",
      siret: entreprise.siret || "",
      logo: entreprise.logo || "",
      tvaActive: entreprise.tvaActive ?? true,
      territoire: entreprise.territoire || "guyane",
      regime: entreprise.regime || "reel",
    });
  }, [entreprise]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEntrepriseForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    if (!entrepriseId || !isAdmin) return;
    setLoading(true);
    try {
      let logo = entrepriseForm.logo;
      if (logoFile) {
        const storageRef = ref(storage, `logos/${entrepriseId}.png`);
        await uploadBytes(storageRef, logoFile);
        logo = await getDownloadURL(storageRef);
      }
      const tvaRate = getTvaRate(entrepriseForm.territoire, entrepriseForm.regime);
      const mentionLegale = getMentionLegale(entrepriseForm.territoire, entrepriseForm.regime);
      const octroiDeMer = hasOctroiDeMer(entrepriseForm.territoire);

      await setDoc(doc(db, "entreprises", entrepriseId), {
        ...entrepriseForm,
        logo,
        tvaRate,
        mentionLegale,
        octroiDeMer,
      }, { merge: true });

      await refreshEntreprise();
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
      if (isAdmin && entrepriseId) {
        const batch = writeBatch(db);
        for (const col of ["factures", "depenses", "clients", "membres", "categories", "devis"]) {
          const snap = await getDocs(collection(db, "entreprises", entrepriseId, col));
          snap.forEach((d) => batch.delete(d.ref));
        }
        batch.delete(doc(db, "entreprises", entrepriseId));
        batch.delete(doc(db, "utilisateurs", user.uid));
        await batch.commit();
      } else {
        await deleteDoc(doc(db, "utilisateurs", user.uid));
        if (entrepriseId) await deleteDoc(doc(db, "entreprises", entrepriseId, "membres", user.uid));
      }
      await deleteUser(user);
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Erreur : " + err.message);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";
  const tvaPreview = getTvaRate(entrepriseForm.territoire, entrepriseForm.regime);
  const mentionPreview = getMentionLegale(entrepriseForm.territoire, entrepriseForm.regime);
  const octroiPreview = hasOctroiDeMer(entrepriseForm.territoire);

  return (
    <main className="max-w-xl">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Paramètres</h2>

      {isAdmin && (
        <>
          {/* ── Entreprise ── */}
          <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
            <h3 className="text-sm font-bold text-[#0d1b3e] mb-4">Entreprise</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Nom de l'entreprise</label>
                <input type="text" name="nom" value={entrepriseForm.nom} onChange={handleChange} placeholder="Nom de l'entreprise" className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Numéro SIRET</label>
                <input type="text" name="siret" value={entrepriseForm.siret} onChange={handleChange} placeholder="123 456 789 00012" className={inputClass} />
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
                <input type="checkbox" name="tvaActive" checked={entrepriseForm.tvaActive} onChange={handleChange} className="w-4 h-4 accent-emerald-600" />
                <span className="text-sm text-gray-700">Activer la gestion de la TVA</span>
              </label>
            </div>
          </section>

          {/* ── Fiscalité & Territoire ── */}
          <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
            <h3 className="text-sm font-bold text-[#0d1b3e] mb-1">Fiscalité & Territoire</h3>
            <p className="text-xs text-gray-400 mb-4">Ces paramètres sont appliqués automatiquement sur toutes vos factures.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Territoire</label>
                <select name="territoire" value={entrepriseForm.territoire} onChange={handleChange} className={inputClass}>
                  {Object.entries(TERRITORIES).map(([key, t]) => (
                    <option key={key} value={key}>{t.flag} {t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Régime fiscal</label>
                <select name="regime" value={entrepriseForm.regime} onChange={handleChange} className={inputClass}>
                  {Object.entries(REGIMES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Aperçu fiscal en temps réel */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-semibold text-emerald-700 mb-1">Aperçu — paramètres calculés automatiquement</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Taux de TVA</span>
                  <span className="font-bold text-emerald-700">{tvaPreview}%</span>
                </div>
                {mentionPreview && (
                  <div className="flex items-start justify-between text-sm gap-4">
                    <span className="text-gray-600 flex-shrink-0">Mention légale</span>
                    <span className="font-medium text-gray-700 text-right text-xs leading-snug">{mentionPreview}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Octroi de mer</span>
                  {octroiPreview
                    ? <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg text-xs">Activé</span>
                    : <span className="text-gray-400 text-xs">Non applicable</span>
                  }
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Mon compte ── */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h3 className="text-sm font-bold text-[#0d1b3e] mb-4">Mon compte</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
            <input type="email" value={user?.email || ""} disabled className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
          </div>
          {isAdmin && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
            >
              {loading ? "Enregistrement..." : "Enregistrer les paramètres"}
            </button>
          )}
        </div>
      </section>

      {/* ── Sécurité ── */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h3 className="text-sm font-bold text-[#0d1b3e] mb-4">Sécurité</h3>
        <button
          onClick={handleResetPassword}
          className="w-full border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-xl transition text-sm"
        >
          Réinitialiser le mot de passe par email
        </button>
      </section>

      {/* ── Zone dangereuse ── */}
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
