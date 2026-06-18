import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { signInWithGoogle, consumeGoogleRedirect } from "../lib/googleAuth";
import { TERRITORIES, REGIMES, getTvaRate, getMentionLegale } from "../lib/territories";
import { FaCheckCircle, FaArrowRight, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { track, identifyUser, EVENTS } from "../lib/analytics";

// Pionnier : après l'inscription, rebond direct vers le checkout Stripe (paiement unique 199€)
const PIONNIER_PRICE_ID = "price_1TdcJZIck4iMBRE9KizjlK9I";

export default function Inscription() {
  const navigate = useNavigate();
  const location = useLocation();

  // Étape courante du formulaire
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Authentifié via Google → compte déjà créé, on saute la création email/mdp.
  const [googleAuth, setGoogleAuth] = useState(false);
  // Empêche le guard "déjà connecté → /dashboard" de tirer pendant le flux Google
  // (le user Google neuf doit RESTER pour finir l'onboarding entreprise).
  const googleFlowRef = useRef(!!location.state?.googleOk);

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

  // Bloquer l'accès direct sans paiement ou essai (googleOk = onboarding Google autorisé)
  useEffect(() => {
    const state = location.state;
    if (!state || (!state.paymentOk && !state.trialOk && !state.googleOk)) {
      navigate("/", { replace: true });
    }
  }, [location.state, navigate]);

  // Flux Google venu du Login : compte déjà authentifié, on va directement à
  // l'étape entreprise (préremplissage nom/email depuis le profil Google).
  useEffect(() => {
    if (!location.state?.googleOk) return;
    const finishGoogle = (u) => {
      if (!u) return;
      setNom((n) => n || u.displayName || "");
      setEmail((e) => e || u.email || "");
      setGoogleAuth(true);
      setStep(2);
    };
    if (auth.currentUser) finishGoogle(auth.currentUser);
    else consumeGoogleRedirect().then(finishGoogle); // retour fallback redirect mobile
  }, [location.state]);

  // Rediriger si déjà connecté (sauf flux Pionnier ou flux Google en cours)
  useEffect(() => {
    if (location.state?.fromPionnier) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (googleFlowRef.current) return; // onboarding Google : ne pas couper
      if (user) navigate("/dashboard");
    });
    return () => unsub();
  }, [navigate, location.state]);

  const handleStep1 = (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setError("");
    setStep(2);
  };

  // Inscription via Google : authentifie, préremplit, puis passe à l'étape entreprise.
  const handleGoogleSignup = async () => {
    setError("");
    setGoogleLoading(true);
    googleFlowRef.current = true; // bloque le guard "déjà connecté" déclenché par le login
    try {
      const u = await signInWithGoogle();
      if (u) {
        setNom((n) => n || u.displayName || "");
        setEmail(u.email || "");
        setGoogleAuth(true);
        setStep(2);
      }
      // u === null : un redirect a été déclenché, la page reviendra et l'effet
      // googleOk reprendra la main (state propagé ci-dessous).
    } catch (e) {
      googleFlowRef.current = false;
      if (e?.code !== "auth/popup-closed-by-user" && e?.code !== "auth/cancelled-popup-request") {
        setError("Connexion Google impossible. Réessayez.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // En flux Google le compte est déjà authentifié → ne pas le déconnecter.
      if (auth.currentUser && !googleAuth) await signOut(auth);

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

      const referredBy = state.ref || null;

      let user;
      if (googleAuth) {
        user = auth.currentUser;
        if (!user) {
          setError("Session Google expirée. Reconnectez-vous.");
          setLoading(false);
          return;
        }
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
      }

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
        ...(referredBy ? { referredBy } : {}),
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

      // Amplitude : signup terminé (funnel d'activation) + identification user
      identifyUser(user.uid, { plan: state.planId || (isPaid ? "paid" : "trial"), territoire });
      track(EVENTS.SIGNUP_COMPLETED, { paid: isPaid, plan: state.planId || null });

      // Pixel Meta : essai gratuit créé → event d'optimisation de la pub froide.
      // (Le flux payant/Pionnier déclenche Purchase plus loin, sur /paiement/success.)
      if (!isPaid && typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("track", "CompleteRegistration", { content_name: "trial" });
      }

      // Flux Pionnier : enchaîner directement sur le paiement Stripe (199€ une fois)
      if (state.fromPionnier) {
        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/stripe-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ priceId: PIONNIER_PRICE_ID, planId: "pionnier" }),
          });
          const data = await res.json();
          if (data.url) {
            window.location = data.url;
            return;
          }
        } catch (checkoutErr) {
          console.error("Checkout Pionnier:", checkoutErr);
        }
        // Repli : retour aux forfaits — le bandeau Pionnier relance le paiement en 1 clic
        navigate("/Forfaits");
        return;
      }

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

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
            >
              <img src="/google-icon.svg" alt="" className="h-5 w-5" />
              {googleLoading ? "Connexion…" : "Continuer avec Google"}
            </button>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex-1 h-px bg-gray-200" /> ou par email <span className="flex-1 h-px bg-gray-200" />
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Voir le mot de passe"}
                >
                  {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
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
