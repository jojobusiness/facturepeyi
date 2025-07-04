import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [totals, setTotals] = useState({ revenus: 0, paiements: 0, depenses: 0 });

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  useEffect(() => {
    const fetchData = async () => {
      // Factures de revenus
      const revenusSnap = await getDocs(collection(db, 'factures'));
      const revenusData = revenusSnap.docs.map(doc => doc.data());

      // Factures de dépenses
      const depensesSnap = await getDocs(collection(db, 'depenses')); // Change 'depenses' si ta collection a un autre nom
      const depensesData = depensesSnap.docs.map(doc => doc.data());

      // Calcul des totaux
      const revenus = revenusData.reduce((sum, f) => f.status !== 'impayée' ? sum + parseFloat(f.amount) : sum, 0);
      const paiements = revenusData.filter(f => f.status === 'payée').length;
      const totalDepenses = depensesData.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

      setInvoices(revenusData);
      setDepenses(depensesData);
      setTotals({ revenus, paiements, depenses: totalDepenses });
    };

    fetchData();
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
        <DashboardCard title="➕ Créer une facture" subtitle="Nouvelle facture à générer" onClick={() => navigate('/facture/nouvelle')} />
        <DashboardCard title="📁 Mes factures" subtitle="Voir toutes les factures" onClick={() => navigate('/factures')} />
        <DashboardCard title="👥 Mes clients" subtitle="Liste et gestion des clients" onClick={() => navigate('/clients')} />
        <DashboardCard title="⚙️ Paramètres" subtitle="Personnalisation du compte" onClick={() => navigate('/parametres')} />
        <DashboardCard title="📦 Dépenses" subtitle="Ajouter ou consulter les achats" onClick={() => navigate('/depenses')} />
        <DashboardCard title="📄 Rapports PDF" subtitle="Exporter vos documents" onClick={() => navigate('/rapports')} />
      </section>

      {/* STATISTIQUES */}
      <section className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold text-[#1B5E20] mb-4">📈 Statistiques générales</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="💰 Revenus encaissés" value={`${totals.revenus} €`} />
          <StatCard label="📬 Paiements reçus" value={totals.paiements} />
          <StatCard label="💸 Dépenses totales" value={`${totals.depenses} €`} />
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prepareMonthlyData(invoices, depenses)}>
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenu" fill="#2E7D32" name="Revenus (€)" />
              <Bar dataKey="depense" fill="#C62828" name="Dépenses (€)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}

// 🧱 Composants réutilisables
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

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-100 p-4 rounded shadow text-center">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-lg font-bold text-[#1B5E20]">{value}</p>
    </div>
  );
}

// 📊 Fonction pour fusionner les données mensuelles revenus + dépenses
function prepareMonthlyData(factures, depenses) {
  const moisMap = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
  ];

  const data = Array(12).fill(0).map((_, i) => ({
    mois: moisMap[i],
    revenu: 0,
    depense: 0,
  }));

  // Revenus
  for (const f of factures) {
    const date = f.date?.toDate?.();
    if (!date || f.status === 'impayée') continue;
    const m = date.getMonth();
    data[m].revenu += parseFloat(f.amount || 0);
  }

  // Dépenses
  for (const d of depenses) {
    const date = d.date?.toDate?.();
    if (!date) continue;
    const m = date.getMonth();
    data[m].depense += parseFloat(d.amount || 0);
  }

  return data;
}