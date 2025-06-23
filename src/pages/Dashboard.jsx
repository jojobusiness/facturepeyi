import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <header className="bg-white shadow p-4 mb-6 rounded flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1B5E20]">Tableau de bord</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Déconnexion
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Créer une facture" onClick={() => navigate('/facture/nouvelle')} />
        <Card title="Mes factures" onClick={() => navigate('/factures')} />
        <Card title="Mes clients" onClick={() => navigate('/clients')} />
        <Card title="Paramètres" onClick={() => navigate('/parametres')} />
      </section>
    </main>
  );
}

function Card({ title, onClick }) {
  return (
    <div onClick={onClick} className="bg-white p-6 rounded-lg shadow hover:shadow-lg cursor-pointer transition">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
    </div>
  );
}