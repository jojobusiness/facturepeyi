import { useEffect, useState } from "react";
import { auth, db, storage } from "../lib/firebase";
import { doc, setDoc, deleteDoc, writeBatch, collection, getDocs, query, where } from "firebase/firestore";
import { EmailAuthProvider, GoogleAuthProvider, sendPasswordResetEmail, reauthenticateWithCredential, reauthenticateWithPopup, deleteUser } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { TERRITORIES, REGIMES, getTvaRate, getMentionLegale, hasOctroiDeMer } from "../lib/territories";

export default function Settings() {
  const navigate = useNavigate();
  const { entreprise, entrepriseId, refreshEntreprise } = useAuth();
  const user = auth.currentUser;
  const isAdmin = entreprise?.ownerUid === user?.uid;

  const [searchParams] = useSearchParams();
  const stripeStatus = searchParams.get("stripe");

  const [entrepriseForm, setEntrepriseForm] = useState({
    nom: "", siret: "", logo: "", tvaActive: true, territoire: "guyane", regime: "reel",
    adresse: "", codePostal: "", ville: "", telephone: "", emailContact: "",
    numeroTVA: "", formeJuridique: "", capital: "", rcs: "", iban: "", bic: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const stripeConnected = !!entreprise?.stripeConnectedAccountId;

  const handleStripeConnect = async () => {
    if (!user || !entrepriseId) return;
    try {
      const token = await user.getIdToken();
      const r = await fetch("/api/stripe-connect-oauth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ entrepriseId }),
      });
      const data = await r.json();
      if (!r.ok || !data.url) {
        alert(data.error || "Erreur lors de la connexion Stripe.");
        return;
      }
      window.location.href = data.url;
    } catch {
      alert("Erreur lors de la connexion Stripe.");
    }
  };

  const handleStripeDisconnect = async () => {
    if (!window.confirm("Déconnecter Stripe ? Vos clients ne pourront plus payer en ligne.")) return;
    setDisconnecting(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/stripe-connect-disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ entrepriseId }),
      });
      await refreshEntreprise();
    } catch {
      alert("Erreur lors de la déconnexion Stripe.");
    } finally {
      setDisconnecting(false);
    }
  };

  useEffect(() => {
    if (!entreprise) return;
    setEntrepriseForm({
      nom: entreprise.nom || "",
      siret: entreprise.siret || "",
      logo: entreprise.logo || "",
      tvaActive: entreprise.tvaActive ?? true,
      territoire: entreprise.territoire || "guyane",
      regime: entreprise.regime || "reel",
      adresse: entreprise.adresse || "",
      codePostal: entreprise.codePostal || "",
      ville: entreprise.ville || "",
      telephone: entreprise.telephone || "",
      emailContact: entreprise.emailContact || "",
      numeroTVA: entreprise.numeroTVA || "",
      formeJuridique: entreprise.formeJuridique || "",
      capital: entreprise.capital || "",
      rcs: entreprise.rcs || "",
      iban: entreprise.iban || "",
      bic: entreprise.bic || "",
      relancesDevisActives: entreprise.relancesDevisActives ?? true,
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
    // Réauthentification requise par Firebase avant suppression. Selon le mode de
    // connexion : popup Google pour les comptes Google, mot de passe sinon.
    const isGoogle = user?.providerData?.some((p) => p.providerId === "google.com");
    try {
      if (isGoogle) {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      } else {
        const password = prompt("Entrez votre mot de passe pour confirmer :");
        if (!password) return;
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }
      if (isAdmin && entrepriseId) {
        const batch = writeBatch(db);
        for (const col of ["factures", "depenses", "clients", "membres", "categories", "devis", "recurrences"]) {
          const snap = await getDocs(collection(db, "entreprises", entrepriseId, col));
          snap.forEach((d) => batch.delete(d.ref));
        }
        // Supprimer les liens de paiement publics liés à cette entreprise
        const linksSnap = await getDocs(query(collection(db, "paymentLinks"), where("entrepriseId", "==", entrepriseId)));
        linksSnap.forEach((d) => batch.delete(d.ref));
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

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="relancesDevisActives"
                  checked={entrepriseForm.relancesDevisActives ?? true}
                  onChange={handleChange}
                  className="w-4 h-4 accent-emerald-600 mt-0.5"
                />
                <span className="text-sm text-gray-700">
                  Relancer automatiquement mes devis sans réponse
                  <span className="block text-xs text-gray-400 mt-0.5">
                    Deux relances (3 et 7 jours après l'envoi) puis un rappel 2 jours avant l'expiration.
                    Aucune relance après acceptation, refus ou conversion en facture.
                  </span>
                </span>
              </label>
            </div>
          </section>

          {/* ── Coordonnées & mentions légales (facture + Factur-X) ── */}
          <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
            <h3 className="text-sm font-bold text-[#0d1b3e] mb-1">Coordonnées & mentions légales</h3>
            <p className="text-xs text-gray-400 mb-4">Ces informations apparaissent sur vos factures et devis, et alimentent le format Factur-X.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Adresse</label>
                <input type="text" name="adresse" value={entrepriseForm.adresse} onChange={handleChange} placeholder="12 rue des Îles" className={inputClass} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Code postal</label>
                  <input type="text" name="codePostal" value={entrepriseForm.codePostal} onChange={handleChange} placeholder="97200" className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Ville</label>
                  <input type="text" name="ville" value={entrepriseForm.ville} onChange={handleChange} placeholder="Fort-de-France" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Téléphone</label>
                  <input type="text" name="telephone" value={entrepriseForm.telephone} onChange={handleChange} placeholder="0596 00 00 00" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Email de contact</label>
                  <input type="email" name="emailContact" value={entrepriseForm.emailContact} onChange={handleChange} placeholder="contact@monentreprise.fr" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">N° TVA intracommunautaire <span className="text-gray-400 font-normal">(si assujetti)</span></label>
                <input type="text" name="numeroTVA" value={entrepriseForm.numeroTVA} onChange={handleChange} placeholder="FR12345678901" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Forme juridique</label>
                  <input type="text" name="formeJuridique" value={entrepriseForm.formeJuridique} onChange={handleChange} placeholder="SARL, EI, SAS…" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Capital social <span className="text-gray-400 font-normal">(€)</span></label>
                  <input type="text" name="capital" value={entrepriseForm.capital} onChange={handleChange} placeholder="1 000" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">RCS / RM</label>
                <input type="text" name="rcs" value={entrepriseForm.rcs} onChange={handleChange} placeholder="RCS Fort-de-France 123 456 789" className={inputClass} />
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-3">Coordonnées bancaires <span className="text-gray-400 font-normal">(affichées sur la facture si renseignées)</span></p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">IBAN</label>
                    <input type="text" name="iban" value={entrepriseForm.iban} onChange={handleChange} placeholder="FR76 ..." className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">BIC</label>
                    <input type="text" name="bic" value={entrepriseForm.bic} onChange={handleChange} placeholder="XXXXXXXX" className={inputClass} />
                  </div>
                </div>
              </div>
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

      {/* ── Portail paiement Stripe Connect ── */}
      {isAdmin && (
        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
          <h3 className="text-sm font-bold text-[#0d1b3e] mb-1">Portail paiement en ligne</h3>
          <p className="text-xs text-gray-400 mb-4">
            Vos clients paient directement depuis leur lien de facture. Factur'Peyi prélève <strong>2,5%</strong> par transaction — le reste va sur votre compte Stripe.
          </p>

          {stripeConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>
                <span className="text-sm font-semibold text-emerald-700">Paiements en ligne activés</span>
              </div>
              <p className="text-xs text-gray-400">
                Vos clients peuvent régler leurs factures par carte bancaire depuis le portail.
              </p>
              <button
                onClick={handleStripeDisconnect}
                disabled={disconnecting}
                className="text-xs text-red-400 hover:text-red-600 transition font-medium disabled:opacity-60"
              >
                {disconnecting ? "Déconnexion..." : "Déconnecter Stripe"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleStripeConnect}
              className="w-full bg-[#635bff] hover:bg-[#5048e5] text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              Connecter mon compte Stripe
            </button>
          )}

          {stripeStatus === "connected" && (
            <p className="text-xs text-emerald-600 font-medium mt-3">✓ Compte Stripe connecté avec succès !</p>
          )}
          {stripeStatus === "error" && (
            <p className="text-xs text-red-500 mt-3">Erreur lors de la connexion. Vérifiez votre compte Stripe et réessayez.</p>
          )}
        </section>
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
