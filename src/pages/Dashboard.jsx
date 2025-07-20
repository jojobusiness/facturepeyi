import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
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

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "utilisateurs", user.uid));
      const userData = userDoc.data();
      const entrepriseId = userData?.entrepriseId;
      if (!entrepriseId) return;

      const revenusSnap = await getDocs(
        collection(db, 'entreprises', entrepriseId, 'factures')
      );
      const revenusData = revenusSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const depensesSnap = await getDocs(
        collection(db, 'entreprises', entrepriseId, 'depenses')
      );
      const depensesData = depensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const catSnap = await getDocs(
        collection(db, 'entreprises', entrepriseId, 'categories')
      );
      const categoriesData = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const paiements = revenusData.filter(f => f.status === 'payée').length;
      const revenus = revenusData.reduce((sum, f) => f.status !== 'impayée' ? sum + parseFloat(f.totalTTC || 0) : sum, 0);
      const totalDepenses = depensesData.reduce((sum, d) => sum + parseFloat(d.montantTTC || 0), 0);

      setInvoices(revenusData);
      setDepenses(depensesData);
      setCategories(categoriesData);
      setTotals({ revenus, paiements, depenses: totalDepenses });
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <p className="p-4">Chargement du tableau de bord...</p>;

  // Le visuel ci-dessous est modernisé (sidebar, stats à droite, couleurs clean)
  return (
    <div className="w-full h-full flex flex-col gap-8 max-w-6xl mx-auto px-2 py-4">
      <h2 className="text-2xl font-bold text-[#1B5E20] mb-4">📈 Statistiques générales</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="💰 Revenus encaissés" value={`${totals.revenus.toFixed(2)} €`} />
        <StatCard label="📬 Paiements reçus" value={totals.paiements} />
        <StatCard label="💸 Dépenses totales" value={`${totals.depenses.toFixed(2)} €`} />
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <h3 className="font-semibold text-[#1B5E20] mb-2">Évolution revenus/dépenses par mois</h3>
          <div className="w-full h-64">
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
        </div>
        <div className="flex-1 flex flex-col items-center">
          <h3 className="font-semibold text-[#1B5E20] mb-2">Dépenses par catégorie</h3>
          {categories.length > 0 && depenses.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={preparePieData(depenses, categories)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
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
            <p className="text-sm text-gray-500 text-center mt-12">
              Aucune dépense catégorisée à afficher.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- StatCard modernisé (garde la logique, juste style)
function StatCard({ label, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-[#1B5E20]">{value}</p>
    </div>
  );
}

// --- Fonctions utilitaires (inchangées)
function prepareMonthlyData(factures, depenses) {
  const moisMap = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  const data = Array(12).fill(0).map((_, i) => ({ mois: moisMap[i], revenu: 0, depense: 0 }));

  for (const f of factures) {
    const rawDate = f.date?.toDate?.() || new Date(f.date);
    if (!rawDate || isNaN(rawDate) || f.status === 'impayée') continue;

    const m = rawDate.getMonth();
    const montant = parseFloat(f.totalTTC || 0);
    data[m].revenu += montant;
  }

  for (const d of depenses) {
    const rawDate = d.date?.toDate?.() || new Date(d.date);
    if (!rawDate || isNaN(rawDate)) continue;

    const m = rawDate.getMonth();
    const montant = parseFloat(d.montantTTC || 0);
    data[m].depense += montant;
  }

  return data;
}

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

function getRandomColor(key) {
  const hash = Array.from(key).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colors = ['#FF5722', '#2196F3', '#4CAF50', '#FFC107', '#9C27B0', '#00BCD4'];
  return colors[hash % colors.length];
}