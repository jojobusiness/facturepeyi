import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  FaEuroSign, FaFileInvoice, FaClock, FaChartLine,
  FaExclamationTriangle, FaArrowUp, FaArrowDown, FaUsers,
} from 'react-icons/fa';
import OnboardingChecklist from '../components/OnboardingChecklist';

const MOIS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const COLORS = ['#059669','#2563eb','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16','#f97316'];

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function fmt(n) {
  return Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function pct(a, b) {
  if (!b) return null;
  const v = ((a - b) / b) * 100;
  return { value: Math.abs(v).toFixed(1), up: v >= 0 };
}

function toDate(ts) {
  if (!ts) return null;
  if (ts?.toDate) return ts.toDate();
  const d = new Date(ts);
  return isNaN(d) ? null : d;
}

function isEnRetard(facture) {
  if (facture.status === "payée") return false;
  const d = toDate(facture.date);
  if (!d) return false;
  const echeance = facture.dateEcheance ? toDate(facture.dateEcheance) : new Date(d.getTime() + 30 * 86400000);
  return echeance < new Date();
}

function prepareMonthlyData(factures, depenses) {
  const data = MOIS.map((m) => ({ mois: m, revenu: 0, depense: 0 }));
  const year = new Date().getFullYear();
  for (const f of factures) {
    const d = toDate(f.date);
    if (!d || d.getFullYear() !== year || f.status !== "payée") continue;
    data[d.getMonth()].revenu += parseFloat(f.totalTTC || 0);
  }
  for (const dep of depenses) {
    const d = toDate(dep.date);
    if (!d || d.getFullYear() !== year) continue;
    data[d.getMonth()].depense += parseFloat(dep.montantTTC || 0);
  }
  return data;
}

function preparePieData(depenses, categories) {
  return categories
    .map((cat, i) => ({
      name: cat.nom,
      value: depenses.filter((d) => d.categorieId === cat.id).reduce((s, d) => s + parseFloat(d.montantHT || 0), 0),
      color: cat.couleur || COLORS[i % COLORS.length],
    }))
    .filter((c) => c.value > 0);
}

function top5Clients(factures) {
  const map = {};
  for (const f of factures) {
    if (!f.clientNom) continue;
    map[f.clientNom] = (map[f.clientNom] || 0) + parseFloat(f.totalTTC || 0);
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nom, ca]) => ({ nom, ca }));
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function KPICard({ icon, label, value, sub, subUp, accent }) {
  const accentMap = {
    green:  "bg-emerald-50 text-emerald-700",
    red:    "bg-red-50 text-red-600",
    blue:   "bg-blue-50 text-blue-700",
    yellow: "bg-yellow-50 text-yellow-700",
    gray:   "bg-gray-50 text-gray-600",
  };
  const iconBg = accentMap[accent] || accentMap.gray;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {sub !== undefined && sub !== null && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${subUp ? "text-emerald-600" : "text-red-500"}`}>
            {subUp ? <FaArrowUp className="w-2.5 h-2.5" /> : <FaArrowDown className="w-2.5 h-2.5" />}
            {sub}%
          </span>
        )}
      </div>
      <div>
        <div className="text-xl font-extrabold text-[#0d1b3e] leading-tight">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function AlerteRetard({ factures }) {
  if (!factures.length) return null;
  const total = factures.reduce((s, f) => s + parseFloat(f.totalTTC || 0), 0);
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <FaExclamationTriangle className="text-red-500 w-4 h-4" />
        <span className="font-bold text-red-700 text-sm">
          {factures.length} facture{factures.length > 1 ? "s" : ""} en retard — {fmt(total)} à recouvrer
        </span>
      </div>
      <div className="space-y-2">
        {factures.slice(0, 5).map((f) => {
          const d = toDate(f.date);
          return (
            <div key={f.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-red-100">
              <div>
                <div className="text-sm font-semibold text-[#0d1b3e]">{f.clientNom || "Client inconnu"}</div>
                <div className="text-xs text-gray-400">{d ? d.toLocaleDateString("fr-FR") : "—"}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-red-600 text-sm">{fmt(f.totalTTC)}</span>
                <Link
                  to={`/dashboard/facture/modifier/${f.id}`}
                  className="text-xs text-emerald-700 border border-emerald-200 rounded-lg px-2 py-1 hover:bg-emerald-50 transition"
                >
                  Voir
                </Link>
              </div>
            </div>
          );
        })}
        {factures.length > 5 && (
          <p className="text-xs text-red-400 text-center pt-1">+{factures.length - 5} autres</p>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { entrepriseId, entreprise } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entrepriseId) return;
    const load = async () => {
      try {
        const [facSnap, depSnap, catSnap, cliSnap, memSnap] = await Promise.all([
          getDocs(collection(db, "entreprises", entrepriseId, "factures")),
          getDocs(collection(db, "entreprises", entrepriseId, "depenses")),
          getDocs(collection(db, "entreprises", entrepriseId, "categories")),
          getDocs(collection(db, "entreprises", entrepriseId, "clients")),
          getDocs(collection(db, "entreprises", entrepriseId, "membres")),
        ]);
        setInvoices(facSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDepenses(depSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCategories(catSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setClients(cliSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setMembres(memSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Erreur chargement dashboard :", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [entrepriseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">Chargement du tableau de bord…</div>
      </div>
    );
  }

  // ── Calculs KPIs ──
  const now = new Date();
  const moisCourant = now.getMonth();
  const annee = now.getFullYear();

  const facPayees = invoices.filter((f) => f.status === "payée");
  const facEnAttente = invoices.filter((f) => f.status !== "payée");
  const facEnRetard = invoices.filter(isEnRetard);

  const caAnnee = facPayees
    .filter((f) => toDate(f.date)?.getFullYear() === annee)
    .reduce((s, f) => s + parseFloat(f.totalTTC || 0), 0);

  const caMoisCourant = facPayees
    .filter((f) => { const d = toDate(f.date); return d?.getMonth() === moisCourant && d?.getFullYear() === annee; })
    .reduce((s, f) => s + parseFloat(f.totalTTC || 0), 0);

  const caMoisPrec = facPayees
    .filter((f) => {
      const d = toDate(f.date);
      const prevM = moisCourant === 0 ? 11 : moisCourant - 1;
      const prevY = moisCourant === 0 ? annee - 1 : annee;
      return d?.getMonth() === prevM && d?.getFullYear() === prevY;
    })
    .reduce((s, f) => s + parseFloat(f.totalTTC || 0), 0);

  const progressionMois = pct(caMoisCourant, caMoisPrec);

  const aRecouvrer = facEnAttente.reduce((s, f) => s + parseFloat(f.totalTTC || 0), 0);
  const tauxRecouvrement = invoices.length
    ? ((facPayees.length / invoices.length) * 100).toFixed(0)
    : 0;

  const depensesMois = depenses
    .filter((d) => { const date = toDate(d.date); return date?.getMonth() === moisCourant && date?.getFullYear() === annee; })
    .reduce((s, d) => s + parseFloat(d.montantTTC || 0), 0);

  const top5 = top5Clients(invoices);
  const maxCA = top5[0]?.ca || 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0d1b3e]">Tableau de bord</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {entreprise?.nom && <span className="font-medium text-gray-500">{entreprise.nom} · </span>}
            {MOIS[moisCourant]} {annee}
          </p>
        </div>
        <Link
          to="/dashboard/facture/nouvelle"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition"
        >
          + Nouvelle facture
        </Link>
      </div>

      {/* ── Onboarding guidé ── */}
      <OnboardingChecklist
        counts={{ invoices: invoices.length, clients: clients.length, membres: membres.length }}
      />

      {/* ── Alerte factures en retard ── */}
      <AlerteRetard factures={facEnRetard} />

      {/* ── KPIs ligne 1 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<FaChartLine className="w-4 h-4" />}
          label={`CA ${annee}`}
          value={fmt(caAnnee)}
          accent="green"
        />
        <KPICard
          icon={<FaEuroSign className="w-4 h-4" />}
          label="CA ce mois"
          value={fmt(caMoisCourant)}
          sub={progressionMois?.value}
          subUp={progressionMois?.up}
          accent="blue"
        />
        <KPICard
          icon={<FaClock className="w-4 h-4" />}
          label="À recouvrer"
          value={fmt(aRecouvrer)}
          accent={aRecouvrer > 0 ? "red" : "gray"}
        />
        <KPICard
          icon={<FaFileInvoice className="w-4 h-4" />}
          label="Dépenses ce mois"
          value={fmt(depensesMois)}
          accent="yellow"
        />
      </div>

      {/* ── KPIs ligne 2 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          icon={<FaFileInvoice className="w-4 h-4" />}
          label="Factures payées"
          value={`${facPayees.length} / ${invoices.length}`}
          accent="green"
        />
        <KPICard
          icon={<FaChartLine className="w-4 h-4" />}
          label="Taux de recouvrement"
          value={`${tauxRecouvrement}%`}
          accent={tauxRecouvrement >= 70 ? "green" : "red"}
        />
        <KPICard
          icon={<FaClock className="w-4 h-4" />}
          label="Factures en attente"
          value={`${facEnAttente.length}`}
          accent={facEnRetard.length > 0 ? "red" : "yellow"}
        />
      </div>

      {/* ── Graphiques ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar chart revenus/dépenses */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-[#0d1b3e] text-sm mb-4">Revenus & Dépenses {annee}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={prepareMonthlyData(invoices, depenses)} barSize={14}>
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenu" fill="#059669" name="Revenus (€)" radius={[3,3,0,0]} />
              <Bar dataKey="depense" fill="#ef4444" name="Dépenses (€)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart dépenses */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-[#0d1b3e] text-sm mb-4">Dépenses par catégorie</h3>
          {preparePieData(depenses, categories).length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={preparePieData(depenses, categories)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={40}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {preparePieData(depenses, categories).map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              Aucune dépense catégorisée pour l'instant.
            </div>
          )}
        </div>
      </div>

      {/* ── Top 5 clients ── */}
      {top5.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0d1b3e] text-sm flex items-center gap-2">
              <FaUsers className="text-emerald-600 w-4 h-4" /> Top clients par CA
            </h3>
            <Link to="/dashboard/clients" className="text-xs text-emerald-700 hover:underline">Voir tous</Link>
          </div>
          <div className="space-y-3">
            {top5.map((c, i) => (
              <div key={c.nom} className="flex items-center gap-3">
                <div className="w-6 text-xs font-bold text-gray-300 text-right flex-shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#0d1b3e] truncate">{c.nom}</span>
                    <span className="text-sm font-bold text-emerald-700 ml-2 flex-shrink-0">{fmt(c.ca)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(c.ca / maxCA) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Raccourcis rapides ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Nouvelle facture",  to: "/dashboard/facture/nouvelle",  color: "bg-emerald-600 hover:bg-emerald-700" },
          { label: "Ajouter un client", to: "/dashboard/clients/ajouter",   color: "bg-[#0d1b3e] hover:bg-[#1a2744]" },
          { label: "Saisir une dépense",to: "/dashboard/depenses/nouvelle", color: "bg-yellow-500 hover:bg-yellow-600" },
          { label: "Voir les rapports", to: "/dashboard/rapports",          color: "bg-blue-600 hover:bg-blue-700" },
        ].map((a) => (
          <Link key={a.label} to={a.to} className={`${a.color} text-white text-xs font-bold text-center py-3 px-4 rounded-xl transition`}>
            {a.label}
          </Link>
        ))}
      </div>

    </div>
  );
}
