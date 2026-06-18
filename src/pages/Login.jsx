import { auth, db } from "../lib/firebase";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { signInWithGoogle, consumeGoogleRedirect } from "../lib/googleAuth";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/dashboard");
    });
    return () => unsubscribe();
  }, [navigate]);

  // Aiguillage après authentification Google : si l'utilisateur a déjà une
  // entreprise → dashboard. Sinon (premier login Google) → onboarding entreprise.
  const routeAfterGoogle = async (user) => {
    if (!user) return;
    const snap = await getDoc(doc(db, "utilisateurs", user.uid));
    if (snap.exists() && snap.data()?.entrepriseId) {
      navigate("/dashboard", { replace: true });
    } else {
      // Compte Google neuf : finir l'onboarding (territoire/régime) en essai gratuit.
      navigate("/Inscription", { replace: true, state: { trialOk: true, googleOk: true } });
    }
  };

  // Retour d'un fallback redirect (mobile / popup bloquée)
  useEffect(() => {
    consumeGoogleRedirect().then((u) => { if (u) routeAfterGoogle(u); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const u = await signInWithGoogle();
      if (u) await routeAfterGoogle(u); // null => redirect déclenché, la page va naviguer
    } catch (e) {
      if (e?.code !== "auth/popup-closed-by-user" && e?.code !== "auth/cancelled-popup-request") {
        setError("Connexion Google impossible. Réessayez.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <span className="text-2xl font-black text-[#0d1b3e] tracking-tight">Factur'Peyi</span>
          </Link>
          <p className="text-gray-400 text-sm mt-1">Gérez. Facturez. Encaissez.</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#0d1b3e] mb-6">Connexion</h2>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
          >
            <img src="/google-icon.svg" alt="" className="h-5 w-5" />
            {googleLoading ? "Connexion…" : "Continuer avec Google"}
          </button>

          <div className="flex items-center gap-3 my-5 text-xs text-gray-400">
            <span className="flex-1 h-px bg-gray-200" /> ou par email <span className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
              <input
                type="email"
                placeholder="vous@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <div className="mt-1.5 text-right">
                <Link to="/mot-de-passe-oublie" className="text-xs text-emerald-600 font-semibold hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Pas encore de compte ?{" "}
              <Link to="/Forfaits" className="text-emerald-600 font-semibold hover:underline">
                Commencer gratuitement
              </Link>
            </p>
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition block">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
