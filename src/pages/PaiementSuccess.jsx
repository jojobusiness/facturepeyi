import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PaiementSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("session_id");

  const [loading, setLoading] = useState(true);
  const [paymentOk, setPaymentOk] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError(true);
      setLoading(false);
      return;
    }

    fetch(`/api/verify-payment?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.paymentOk) {
          setPaymentOk(true);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Redirection après 3 secondes si erreur
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        navigate("/Forfaits", { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, navigate]);

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col justify-center items-center bg-green-50 p-8">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md">
          <div className="text-green-700 font-bold text-xl mb-2">Vérification du paiement...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col justify-center items-center bg-red-50 p-8">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-700 mb-4">⛔ Vous n'avez pas encore payé</h1>
          <p className="mb-4">
            Vous allez être redirigé vers la page des forfaits dans quelques secondes...
          </p>
          <Link
            to="/Forfaits"
            className="bg-[#b71c1c] hover:bg-red-900 text-white px-6 py-3 rounded font-medium transition"
          >
            Choisir un forfait
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-green-50 p-8">
      <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md">
        <h1 className="text-3xl font-bold text-green-700 mb-4">🎉 Paiement validé !</h1>
        <p className="mb-6">
          Merci pour votre paiement.<br />
          Vous pouvez maintenant créer votre compte et commencer à utiliser Factur'Peyi.
        </p>
        <Link
          to="/Inscription"
          state={{ paymentOk: true }}
          className="bg-[#1B5E20] hover:bg-green-900 text-white px-6 py-3 rounded font-medium transition"
        >
          Créer mon compte
        </Link>
      </div>
    </main>
  );
}