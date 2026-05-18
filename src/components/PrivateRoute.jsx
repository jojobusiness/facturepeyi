import { Navigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

export default function PrivateRoute({ children }) {
  const { user, entreprise, loading } = useAuth();

  if (loading) return <LoadingScreen message="Chargement de votre espace..." />;
  if (!user) return <Navigate to="/login" replace />;

  // Entreprise suspendue ou supprimée → blocage de l'accès
  if (entreprise && (entreprise.suspended === true || entreprise.deletedAt)) {
    return <SuspendedScreen reason={entreprise.suspendedReason || entreprise.deletedReason} />;
  }

  return children;
}

function SuspendedScreen({ reason }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Compte suspendu</h1>
        <p className="text-sm text-gray-600 mb-4">
          L'accès à ce compte a été temporairement suspendu par notre équipe.
        </p>
        {reason && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 mb-4 text-left">
            <strong className="block mb-1 text-xs text-gray-500 uppercase tracking-wider">Raison</strong>
            {reason}
          </div>
        )}
        <p className="text-xs text-gray-400 mb-6">
          Pour toute question, contactez-nous à{" "}
          <a href="mailto:contact@facturepeyi.com" className="text-emerald-700 font-semibold hover:underline">
            contact@facturepeyi.com
          </a>
        </p>
        <button
          onClick={() => signOut(auth)}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-lg text-sm transition"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
