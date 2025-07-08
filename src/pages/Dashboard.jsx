import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totals, setTotals] = useState({ revenus: 0, paiements: 0, depenses: 0 });
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const revenusSnap = await getDocs(
        query(collection(db, 'factures'), where('uid', '==', uid))
      );
      const revenusData = revenusSnap.docs.map(doc => doc.data());

      const depensesSnap = await getDocs(
        query(collection(db, 'depenses'), where('uid', '==', uid))
      );
      const depensesData = depensesSnap.docs.map(doc => doc.data());

      const catSnap = await getDocs(query(collection(db, 'categories'), where('uid', '==', uid)));
      const categoriesData = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const paiements = revenusData.filter(f => f.status === 'payée').length;
      
      const revenus = revenusData.reduce((sum, f) =>
      f.status !== 'impayée' ? sum + parseFloat(f.totalTTC || 0) : sum, 0);

      const totalDepenses = depensesData.reduce((sum, d) =>
      sum + parseFloat(d.montantTTC || 0), 0);


      setInvoices(revenusData);
      setDepenses(depensesData);
      setCategories(categoriesData);
      setTotals({ revenus, paiements, depenses: totalDepenses });
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <p className="p-4">Chargement du tableau de bord...</p>;

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

      {/* 🔗 Menu */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <DashboardCard title="➕ Créer une facture" subtitle="Nouvelle facture à générer" onClick={() => navigate('/facture/nouvelle')} />
        <DashboardCard title="📁 Mes factures" subtitle="Voir toutes les factures" onClick={() => navigate('/factures')} />
        <DashboardCard title="👥 Mes clients" subtitle="Liste et gestion des clients" onClick={() => navigate('/clients')} />
        <DashboardCard title="📦 Dépenses" subtitle="Ajouter ou consulter les achats" onClick={() => navigate('/depenses')} />
        <DashboardCard title="📄 Déclaration fiscale" subtitle="Fiscalité et TVA" onClick={() => navigate('/declarationfiscale')} />
        <DashboardCard title="📚 Plan Comptable" subtitle="Définiser votre plan comptable" onClick={() => navigate('/plancomptable')} />
        <DashboardCard title="📊 Bilan Comptable" subtitle="Récuperer votre bilan comptable" onClick={() => navigate('/bilancomptable')} />
        <DashboardCard title="📘 Journal Comptable" subtitle="Configurer votre Journal comptable" onClick={() => navigate('/journalcomptable')} />
        <DashboardCard title="📂 Gérer mes catégories" subtitle="Ajouter ou modifier les catégories" onClick={() => navigate('/categories')} />
        <DashboardCard title="⚙️ Admin" subtitle="Gestion des comptes " onClick={() => navigate('/admin')} />
        <DashboardCard title="⚙️ Paramètres" subtitle="Personnalisation du compte" onClick={() => navigate('/parametres')} />
        {/*<DashboardCard title="📄 Rapports PDF" subtitle="Exporter vos documents" onClick={() => navigate('/rapports')} />*/}
      </section>

      {/* 📈 Statistiques et Graphique */}
      <section className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold text-[#1B5E20] mb-4">📈 Statistiques générales</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="💰 Revenus encaissés" value={`${totals.revenus.toFixed(2)} €`} />
          <StatCard label="📬 Paiements reçus" value={totals.paiements} />
          <StatCard label="💸 Dépenses totales" value={`${totals.depenses.toFixed(2)} €`} />
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

        {/* 📊 Dépenses par catégorie */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-[#1B5E20] mb-2">🧾 Répartition des dépenses par catégorie</h2>
          {categories.length > 0 && depenses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={preparePieData(depenses, categories)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {preparePieData(depenses, categories).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500">Aucune dépense catégorisée à afficher.</p>
          )}
        </div>
      </section>
    </main>
  );
}

// 🧱 Cartes
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

// 📊 Données mensuelles
function prepareMonthlyData(factures, depenses) {
  const moisMap = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  const data = Array(12).fill(0).map((_, i) => ({ mois: moisMap[i], revenu: 0, depense: 0 }));

  for (const f of factures) {
    const rawDate = f.date?.toDate?.() || new Date(f.date);
    if (!rawDate || isNaN(rawDate) || f.status === 'impayée') continue;

    const m = rawDate.getMonth();
    const montant = parseFloat(f.totalTTC || 0); // ✅ totalTTC uniquement
    data[m].revenu += montant;
  }

  for (const d of depenses) {
    const rawDate = d.date?.toDate?.() || new Date(d.date);
    if (!rawDate || isNaN(rawDate)) continue;

    const m = rawDate.getMonth();
    const montant = parseFloat(d.montantTTC || 0); // ✅ montantTTC uniquement
    data[m].depense += montant;
  }

  return data;
}


// 🥧 Données pour PieChart
function preparePieData(depenses, categories) {
  const result = [];

  for (const cat of categories) {
    const total = depenses
      .filter(d => d.categorieId === cat.id)
      .reduce((sum, d) => sum + parseFloat(d.montantHT || 0), 0);

    if (total > 0) {
      result.push({
        name: cat.nom,
        value: total,
        color: cat.couleur || getRandomColor(cat.nom),
      });
    }
  }

  return result;
}

// 🌈 Couleurs par défaut si aucune n’est définie
function getRandomColor(key) {
  const hash = Array.from(key).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colors = ['#FF5722', '#2196F3', '#4CAF50', '#FFC107', '#9C27B0', '#00BCD4'];
  return colors[hash % colors.length];
}