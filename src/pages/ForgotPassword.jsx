import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      if (err?.code === "auth/invalid-email") {
        setError("Adresse email invalide.");
      } else if (err?.code === "auth/too-many-requests") {
        setError("Trop de tentatives. Réessayez dans quelques minutes.");
      } else {
        // auth/user-not-found inclus : même message pour ne pas révéler si un
        // compte existe ou non.
        setSent(true);
      }
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
          <h2 className="text-xl font-bold text-[#0d1b3e] mb-2">Mot de passe oublié</h2>
          <p className="text-sm text-gray-500 mb-6">
            Entrez votre adresse email, on vous envoie un lien pour choisir un nouveau mot de passe.
          </p>

          {sent ? (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-800">
                📩 Si un compte existe avec <strong>{email}</strong>, un email de réinitialisation
                vient d'être envoyé. Pensez à vérifier vos spams.
              </div>
              <Link
                to="/login"
                className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="vous@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
              >
                {loading ? "Envoi…" : "Envoyer le lien de réinitialisation"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-emerald-600 font-semibold hover:underline">
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
