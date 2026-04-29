import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { TERRITORIES, REGIMES, getTvaRate, getMentionLegale } from "../lib/territories";
import { FaCheckCircle, FaArrowRight, FaArrowLeft } from "react-icons/fa";

export default function Inscription() {
  const navigate = useNavigate();
  const location = useLocation();

  // Étape courante du formulaire
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Étape 1 — Compte
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Étape 2 — Entreprise
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [territoire, setTerritoire] = useState("martinique");
  const [regime, setRegime] = useState("micro-bic");

  // Valeurs calculées dynamiquement
  const tvaRate = getTvaRate(territoire, regime);
  const mentionLegale = getMentionLegale(territoire, regime);
  const octroiDeMer = TERRITORIES[territoire]?.octroiDeMer ?? false;

  // Bloquer l'accès direct sans paiement ou essai
  useEffect(() => {
    const state = location.state;
    if (!state || (!state.paymentOk && !state.trialOk)) {
      navigate("/", { replace: true });
    }
  }, [location.state, navigate]);

  // Rediriger si déjà connecté
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/dashboard");
    });
    return () => unsub();
  }, [navigate]);

  const handleStep1 = (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (auth.currentUser) await signOut(auth);

      const state = location.state || {};
      const isPaid = !!state.paymentOk;

      const planData = isPaid
        ? {
            plan: state.planId || "solo",
            planStatus: "active",
            stripeCustomerId: state.stripeCustomerId || null,
            stripeSubscriptionId: state.stripeSubscriptionId || null,
          }
        : {
            plan: "decouverte",
            planStatus: "trial",
            trialEndsAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          };

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // Créer le document entreprise avec toute la config fiscale + plan
      const entrepriseRef = await addDoc(collection(db, "entreprises"), {
        nom: nomEntreprise || "Mon entreprise",
        ownerUid: user.uid,
        territoire,
        tvaRate,
        mentionLegale,
        regime,
        octroiDeMer,
        createdAt: serverTimestamp(),
        ...planData,
      });
      const entrepriseId = entrepriseRef.id;

      // Ajouter l'utilisateur comme admin
      await setDoc(doc(db, "entreprises", entrepriseId, "membres", user.uid), {
        uid: user.uid,
        nom,
        email,
        role: "admin",
        dateAjout: serverTimestamp(),
        entrepriseId,
      });

      // Créer le profil utilisateur
      await setDoc(doc(db, "utilisateurs", user.uid), {
        email,
        nom,
        role: "admin",
        createdAt: serverTimestamp(),
        entrepriseId,
        uid: user.uid,
      });

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("Un compte existe déjà avec cet email.");
      } else {
        setError("Erreur : " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <Link to="/" className="text-2xl font-black text-[#0d1b3e] mb-8 tracking-tight">
        Factur'Peyi
      </Link>

      {/* Carte principale */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

        {/* Indicateur d'étapes */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 1 ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"}`}>
            {step > 1 ? <FaCheckCircle className="w-4 h-4" /> : "1"}
          </div>
          <div className={`flex-1 h-0.5 ${step >= 2 ? "bg-emerald-600" : "bg-gray-100"}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 2 ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"}`}>
            2
          </div>
        </div>

        {/* ── ÉTAPE 1 — Compte ── */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-[#0d1b3e]">Créez votre compte</h1>
              <p className="text-sm text-gray-500 mt-1">Étape 1 sur 2 — Vos identifiants</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Nom complet</label>
              <input
                type="text"
                required
                placeholder="Jean Dupont"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Adresse email</label>
              <input
                type="email"
                required
                placeholder="jean@monentreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Mot de passe</label>
              <input
                type="password"
                required
                placeholder="Minimum 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
            >
              Continuer <FaArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ── ÉTAPE 2 — Entreprise ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-[#0d1b3e]">Votre entreprise</h1>
              <p className="text-sm text-gray-500 mt-1">Étape 2 sur 2 — Configuration fiscale</p>
            </div>

            {/* Nom entreprise */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Nom de l'entreprise</label>
              <input
                type="text"
                required
                placeholder="Mon Entreprise SARL"
                value={nomEntreprise}
                onChange={(e) => setNomEntreprise(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Sélecteur territoire */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Territoire d'activité</label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {Object.entries(TERRITORIES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTerritoire(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition ${
                      territoire === key
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{t.flag}</span>
                    <span className="text-xs leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Régime fiscal */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Régime fiscal</label>
              <div className="space-y-2">
                {Object.entries(REGIMES).map(([key, label]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                      regime === key
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="regime"
                      value={key}
                      checked={regime === key}
                      onChange={() => setRegime(key)}
                      className="accent-emerald-600"
                    />
                    <span className={`text-sm ${regime === key ? "font-semibold text-emerald-800" : "text-gray-700"}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preview TVA dynamique */}
            <div className={`rounded-xl px-4 py-3 text-sm ${tvaRate === 0 ? "bg-blue-50 border border-blue-100 text-blue-800" : "bg-emerald-50 border border-emerald-100 text-emerald-800"}`}>
              <div className="font-semibold mb-0.5">
                TVA appliquée sur vos factures : <span className="text-base">{tvaRate}%</span>
                {octroiDeMer && <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Octroi de mer applicable</span>}
              </div>
              {mentionLegale && (
                <div className="text-xs opacity-80 mt-1 italic">"{mentionLegale}"</div>
              )}
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300"
              >
                <FaArrowLeft className="w-3 h-3" /> Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
              >
                {loading ? "Création en cours..." : "Créer mon compte"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gray-400 mt-6">
          Déjà inscrit ?{" "}
          <Link to="/login" className="text-emerald-700 font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
