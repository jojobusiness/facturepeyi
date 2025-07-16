import { Link } from "react-router-dom";

export default function PaiementCancel() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-red-50 p-8">
      <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md">
        <h1 className="text-3xl font-bold text-red-600 mb-4">❌ Paiement annulé</h1>
        <p className="mb-6">Le paiement a été annulé ou a échoué.<br />
          Vous pouvez réessayer quand vous le souhaitez.</p>
        <Link
          to="/forfaits"
          className="bg-[#1B5E20] hover:bg-green-900 text-white px-6 py-3 rounded font-medium transition"
        >
          Retour aux forfaits
        </Link>
      </div>
    </main>
  );
}