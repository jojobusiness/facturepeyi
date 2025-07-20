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
  const [selectedMenu, setSelectedMenu] = useState("dashboard"); // <- Nouveau

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

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

  // Liste des menus (à gauche)
  const menuItems = [
    { key: "dashboard", label: "📊 Statistiques" },
    { key: "factures", label: "📁 Mes factures" },
    { key: "nouvelleFacture", label: "➕ Créer une facture" },
    { key: "clients", label: "👥 Mes clients" },
    { key: "depenses", label: "📦 Dépenses" },
    { key: "declarationfiscale", label: "📄 Déclaration fiscale" },
    { key: "plancomptable", label: "📚 Plan Comptable" },
    { key: "bilancomptable", label: "📊 Bilan Comptable" },
    { key: "journalcomptable", label: "📘 Journal Comptable" },
    { key: "categories", label: "📂 Gérer mes catégories" },
    { key: "admin", label: "⚙️ Admin" },
    { key: "parametres", label: "⚙️ Paramètres" },
    { key: "rapports", label: "📄 Rapports PDF" },
    { key: "logout", label: "🔓 Déconnexion", special: true },
  ];

  if (loading) return <p className="p-4">Chargement du tableau de bord...</p>;

  return (
    <main className="min-h-screen bg-gray-100 flex">
      {/* Sidebar menu à gauche */}
      <aside className="w-64 bg-white p-4 shadow-lg flex flex-col">
        <h1 className="text-2xl font-bold text-[#1B5E20] mb-8 text-center">Factur'Peyi</h1>
        <nav className="flex flex-col gap-2 flex-1">
          {menuItems.map(item => (
            <button
              key={item.key}
              className={`text-left px-4 py-3 rounded-xl font-medium hover:bg-[#E8F5E9] transition ${
                selectedMenu === item.key ? "bg-[#C8E6C9] text-[#1B5E20]" : "text-gray-700"
              } ${item.special ? "mt-8 bg-red-100 hover:bg-red-200 text-red-700" : ""}`}
              onClick={() => {
                if (item.key === "logout") return handleLogout();
                setSelectedMenu(item.key);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content à droite */}
      <section className="flex-1 p-8">
        {selectedMenu === "dashboard" && (
          <DashboardStats
            totals={totals}
            invoices={invoices}
            depenses={depenses}
            categories={categories}
          />
        )}
        {selectedMenu === "factures" && (
          <Placeholder label="Liste des factures" />
        )}
        {selectedMenu === "nouvelleFacture" && (
          <Placeholder label="Formulaire création de facture" />
        )}
        {selectedMenu === "clients" && (
          <Placeholder label="Liste des clients" />
        )}
        {selectedMenu === "depenses" && (
          <Placeholder label="Liste/ajout de dépenses" />
        )}
        {selectedMenu === "declarationfiscale" && (
          <Placeholder label="Déclaration fiscale" />
        )}
        {selectedMenu === "plancomptable" && (
          <Placeholder label="Plan Comptable" />
        )}
        {selectedMenu === "bilancomptable" && (
          <Placeholder label="Bilan Comptable" />
        )}
        {selectedMenu === "journalcomptable" && (
          <Placeholder label="Journal Comptable" />
        )}
        {selectedMenu === "categories" && (
          <Placeholder label="Gestion des catégories" />
        )}
        {selectedMenu === "admin" && (
          <Placeholder label="Gestion Admin" />
        )}
        {selectedMenu === "parametres" && (
          <Placeholder label="Paramètres du compte" />
        )}
        {selectedMenu === "rapports" && (
          <Placeholder label="Rapports PDF" />
        )}
      </section>
    </main>
  );
}

// =============================
// Cartes/statistiques dashboard
// =============================
function DashboardStats({ totals, invoices, depenses, categories }) {
  return (
    <>
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
    </>
  );
}

// ========================================
// Placeholder pour les autres fonctionnalités
// ========================================
function Placeholder({ label }) {
  return (
    <div className="bg-white shadow rounded-xl p-12 text-center text-gray-500 font-medium text-lg">
      {label} (à venir)
    </div>
  );
}

// ====================
// Cartes stats simples
// ====================
function StatCard({ label, value }) {
  return (
    <div className="bg-gray-100 p-4 rounded shadow text-center">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-lg font-bold text-[#1B5E20]">{value}</p>
    </div>
  );
}

// ========================
// Fonctions utilitaires
// ========================
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