import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function PaiementSuccess() {
  // Récupère l'ID de session Stripe pour des usages futurs (par exemple pour vérifier le paiement)
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("session_id");

  useEffect(() => {
    // Ici tu peux (optionnel) appeler ton backend pour vérifier le paiement avec le session_id
    // Ou bien proposer la création de compte (formulaire d'inscription ici)
  }, [sessionId]);

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-green-50 p-8">
      <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md">
        <h1 className="text-3xl font-bold text-green-700 mb-4">🎉 Paiement validé !</h1>
        <p className="mb-6">Merci pour votre paiement.<br />
          Vous pouvez maintenant créer votre compte et commencer à utiliser Factur'Peyi.
        </p>
        {/* Mets ici ton formulaire d'inscription */}
        <Link
          to="/login"
          className="bg-[#1B5E20] hover:bg-green-900 text-white px-6 py-3 rounded font-medium transition"
        >
          Créer mon compte
        </Link>
      </div>
    </main>
  );
}