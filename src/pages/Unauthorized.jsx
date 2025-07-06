import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow-md rounded-lg p-6 text-center max-w-md">
        <h1 className="text-3xl font-bold text-red-600 mb-4">🚫 Accès refusé</h1>
        <p className="text-gray-700 mb-4">
          Vous n’avez pas les autorisations nécessaires pour accéder à cette page.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-[#1B5E20] text-white rounded hover:bg-green-800"
        >
          ← Retour au tableau de bord
        </button>
      </div>
    </main>
  );
}