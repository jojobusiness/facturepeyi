import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [totals, setTotals] = useState({ revenus: 0, paiements: 0 });

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      const snapshot = await getDocs(collection(db, 'factures'));
      const data = snapshot.docs.map(doc => doc.data());
      setInvoices(data);

      // Calcul des totaux simples
      const revenus = data.reduce((sum, f) => f.status !== 'impayée' ? sum + parseFloat(f.amount) : sum, 0);
      const paiements = data.filter(f => f.status === 'payée').length;
      setTotals({ revenus, paiements });
    };

    fetchInvoices();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <header className="bg-white shadow p-4 mb-6 rounded flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1B5E20]">📊 Tableau de bord</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          🔓 Déconnexion
        </button>
      </header>

      {/* MENU DE NAVIGATION */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <DashboardCard
          title="➕ Créer une facture"
          subtitle="Nouvelle facture à générer"
          onClick={() => navigate('/facture/nouvelle')}
        />
        <DashboardCard
          title="📁 Mes factures"
          subtitle="Voir toutes les factures"
          onClick={() => navigate('/factures')}
        />
        <DashboardCard
          title="👥 Mes clients"
          subtitle="Liste et gestion des clients"
          onClick={() => navigate('/clients')}
        />
        <DashboardCard
          title="⚙️ Paramètres"
          subtitle="Personnalisation du compte"
          onClick={() => navigate('/parametres')}
        />
        <DashboardCard
          title="🧾 Statistiques"
          subtitle="Revenus, paiements, etc."
          onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
        />
        <DashboardCard
          title="📄 Rapports PDF"
          subtitle="Exporter vos documents"
          onClick={() => navigate('/rapports')}
        />
      </section>

      {/* STATISTIQUES */}
      <section className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold text-[#1B5E20] mb-4">📈 Statistiques générales</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="💰 Revenus encaissés" value={`${totals.revenus} €`} />
          <StatCard label="📬 Paiements reçus" value={totals.paiements} />
          <StatCard label="📄 Total factures" value={invoices.length} />
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prepareMonthlyData(invoices)}>
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenu" fill="#2E7D32" name="Revenus (€)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}

// CARTE DE MENU
function DashboardCard({ title, subtitle, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg cursor-pointer transition border-l-4 border-[#1B5E20]"
    >
      <h2 className="text-lg font-semibold text-[#1B5E20] mb-1">{title}</h2>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}

// CARTE STATS SIMPLES
function StatCard({ label, value }) {
  return (
    <div className="bg-gray-100 p-4 rounded shadow text-center">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-lg font-bold text-[#1B5E20]">{value}</p>
    </div>
  );
}

// PRÉPARATION DES DONNÉES MENSUELLES
function prepareMonthlyData(factures) {
  const moisMap = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
  ];

  const data = Array(12).fill(0).map((_, i) => ({
    mois: moisMap[i],
    revenu: 0,
  }));

  for (const f of factures) {
    const date = f.date?.toDate?.();
    if (!date || f.status === 'impayée') continue;
    const m = date.getMonth();
    data[m].revenu += parseFloat(f.amount || 0);
  }

  return data;
}