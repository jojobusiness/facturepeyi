import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";
import {
  FaArrowLeft, FaSearch, FaSignOutAlt, FaPause, FaPlay,
  FaTrash, FaUndo, FaExclamationTriangle, FaUsers,
  FaChartLine, FaEuroSign, FaBan, FaLink, FaSync,
} from "react-icons/fa";

const PLAN_LABEL = {
  decouverte: "Découverte",
  solo: "Solo",
  pro: "Pro",
  expert: "Expert",
  cabinet: "Cabinet",
};

const STATUS_BADGE = {
  trial: { label: "Essai", cls: "bg-amber-100 text-amber-700" },
  active: { label: "Actif", cls: "bg-emerald-100 text-emerald-700" },
  past_due: { label: "Impayé", cls: "bg-red-100 text-red-700" },
  canceled: { label: "Annulé", cls: "bg-gray-200 text-gray-600" },
};

function formatEur(amount) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount ?? 0);
}

function formatDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fr-FR"); } catch { return "—"; }
}

async function getAuthToken() {
  const u = auth.currentUser;
  if (!u) throw new Error("Non authentifié");
  return await u.getIdToken();
}

export default function SysAdmin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("entreprises");
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [actionBusy, setActionBusy] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/sysadmin-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Stats: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/sysadmin-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Logs: ${res.status}`);
      const json = await res.json();
      setLogs(json.logs || []);
    } catch (err) {
      setLogs([]);
      console.error(err);
    }
  };

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    if (tab === "logs" && logs === null) loadLogs();
    // eslint-disable-next-line
  }, [tab]);

  const handleAction = async (action, entrepriseId, nom) => {
    let reason = null;
    if (action === "suspend" || action === "soft-delete") {
      reason = window.prompt(
        action === "suspend"
          ? `Raison de la suspension de "${nom}" ?`
          : `Raison de la suppression de "${nom}" ? (soft-delete, réversible)`,
        ""
      );
      if (reason === null) return;
    }
    if (action === "soft-delete") {
      if (!window.confirm(`Confirmer la suppression de "${nom}" ?\n(Soft-delete : l'entreprise est masquée mais récupérable)`)) return;
    }
    setActionBusy(entrepriseId + ":" + action);
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/sysadmin-action", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, entrepriseId, reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      await loadData();
    } catch (err) {
      alert("Erreur : " + (err.message || "inconnue"));
    } finally {
      setActionBusy("");
    }
  };

  const filtered = useMemo(() => {
    if (!data?.entreprises) return [];
    const s = search.trim().toLowerCase();
    return data.entreprises.filter((e) => {
      if (!showDeleted && e.deletedAt) return false;
      if (planFilter !== "all" && e.plan !== planFilter) return false;
      if (statusFilter !== "all" && e.planStatus !== statusFilter) return false;
      if (s) {
        const hay = `${e.nom} ${e.id} ${e.territoire}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [data, search, planFilter, statusFilter, showDeleted]);

  if (loading && !data) return <LoadingScreen message="Chargement du super-admin..." />;

  const kpis = data?.kpis || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-[#0d1b3e] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-300 hover:text-white text-sm flex items-center gap-2">
              <FaArrowLeft className="w-3 h-3" /> Retour site
            </Link>
            <div className="h-5 w-px bg-white/20" />
            <div>
              <div className="font-black tracking-tight">Factur'Peyi</div>
              <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Super-Admin</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-300">{user?.email}</span>
            <button
              onClick={() => signOut(auth)}
              className="text-gray-300 hover:text-white text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10"
            >
              <FaSignOutAlt className="w-3 h-3" /> Déconnexion
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: "entreprises", label: "Entreprises", icon: <FaUsers className="w-3.5 h-3.5" /> },
              { id: "logs", label: "Logs & erreurs", icon: <FaExclamationTriangle className="w-3.5 h-3.5" /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                  tab === t.id
                    ? "border-emerald-400 text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            icon={<FaEuroSign />}
            label="MRR"
            value={formatEur(kpis.mrr)}
            sub={`${kpis.entreprisesActives || 0} entreprises actives`}
            color="emerald"
          />
          <KpiCard
            icon={<FaChartLine />}
            label="Signups 30j"
            value={kpis.signups30d ?? 0}
            sub={`${kpis.totalEntreprises || 0} comptes total`}
            color="blue"
          />
          <KpiCard
            icon={<FaUsers />}
            label="Essais en cours"
            value={kpis.trials ?? 0}
            sub={`${kpis.canceledLast30 || 0} annulations 30j`}
            color="amber"
          />
          <KpiCard
            icon={<FaLink />}
            label="Stripe Connect"
            value={kpis.stripeConnected ?? 0}
            sub={`${formatEur(kpis.commissionsTotal)} de commissions`}
            color="purple"
          />
        </div>

        {tab === "entreprises" && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <div className="relative flex-1 max-w-md">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher (nom, ID, territoire)..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Tous les plans</option>
                <option value="decouverte">Découverte</option>
                <option value="solo">Solo</option>
                <option value="pro">Pro</option>
                <option value="expert">Expert</option>
                <option value="cabinet">Cabinet</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Tous statuts</option>
                <option value="trial">Essai</option>
                <option value="active">Actif</option>
                <option value="past_due">Impayé</option>
                <option value="canceled">Annulé</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="rounded"
                />
                Inclure supprimés
              </label>
              <button
                onClick={loadData}
                className="ml-auto inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <FaSync className="w-3 h-3" /> Rafraîchir
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Entreprise</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3">Territoire</th>
                    <th className="px-5 py-3">Connect</th>
                    <th className="px-5 py-3">Inscrit le</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                        Aucune entreprise trouvée.
                      </td>
                    </tr>
                  )}
                  {filtered.map((e) => {
                    const badge = STATUS_BADGE[e.planStatus] || { label: e.planStatus || "—", cls: "bg-gray-100 text-gray-600" };
                    const busy = actionBusy.startsWith(e.id + ":");
                    return (
                      <tr key={e.id} className={`hover:bg-gray-50 ${e.deletedAt ? "opacity-50" : ""}`}>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-gray-900">{e.nom}</div>
                          <div className="text-xs text-gray-400 font-mono">{e.id}</div>
                          {e.suspended && !e.deletedAt && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs text-red-600 font-semibold">
                              <FaBan className="w-3 h-3" /> Suspendue
                            </span>
                          )}
                          {e.deletedAt && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs text-gray-500 font-semibold">
                              <FaTrash className="w-3 h-3" /> Supprimée {formatDate(e.deletedAt)}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-semibold">{PLAN_LABEL[e.plan] || e.plan}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{e.territoire}</td>
                        <td className="px-5 py-3">
                          {e.stripeConnectedAccountId ? (
                            <span className="text-emerald-600 font-mono text-xs" title={e.stripeConnectedAccountId}>
                              ✓ Connecté
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-500">{formatDate(e.createdAtIso)}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex gap-1">
                            {!e.deletedAt && !e.suspended && (
                              <button
                                disabled={busy}
                                onClick={() => handleAction("suspend", e.id, e.nom)}
                                className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 disabled:opacity-40"
                                title="Suspendre"
                              >
                                <FaPause className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!e.deletedAt && e.suspended && (
                              <button
                                disabled={busy}
                                onClick={() => handleAction("unsuspend", e.id, e.nom)}
                                className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 disabled:opacity-40"
                                title="Réactiver"
                              >
                                <FaPlay className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!e.deletedAt && (
                              <button
                                disabled={busy}
                                onClick={() => handleAction("soft-delete", e.id, e.nom)}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-40"
                                title="Supprimer (soft)"
                              >
                                <FaTrash className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {e.deletedAt && (
                              <button
                                disabled={busy}
                                onClick={() => handleAction("restore", e.id, e.nom)}
                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 disabled:opacity-40"
                                title="Restaurer"
                              >
                                <FaUndo className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} / {data?.entreprises?.length || 0} entreprises
            </div>
          </section>
        )}

        {tab === "logs" && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">Logs & erreurs récentes</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Sources : webhook Stripe, cron, exceptions critiques (collection <code>sysadmin_logs</code>)
                </div>
              </div>
              <button
                onClick={loadLogs}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2"
              >
                <FaSync className="w-3 h-3" /> Rafraîchir
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 w-32">Date</th>
                    <th className="px-5 py-3 w-24">Niveau</th>
                    <th className="px-5 py-3 w-32">Source</th>
                    <th className="px-5 py-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs === null && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">Chargement…</td></tr>
                  )}
                  {logs && logs.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                      Aucun log pour l'instant. Quand des erreurs sont enregistrées par les endpoints API, elles apparaîtront ici.
                    </td></tr>
                  )}
                  {logs && logs.map((l) => {
                    const sev = l.severity || "info";
                    const sevCls =
                      sev === "critical" ? "bg-red-100 text-red-700" :
                      sev === "error" ? "bg-red-50 text-red-600" :
                      sev === "warning" ? "bg-amber-50 text-amber-700" :
                      "bg-gray-100 text-gray-600";
                    return (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {l.createdAtIso ? new Date(l.createdAtIso).toLocaleString("fr-FR") : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${sevCls}`}>
                            {sev}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs font-mono text-gray-600">{l.source}</td>
                        <td className="px-5 py-3 text-gray-800">
                          {l.message}
                          {l.meta && (
                            <pre className="mt-1 text-xs bg-gray-50 rounded p-2 overflow-x-auto text-gray-500">
                              {JSON.stringify(l.meta, null, 2)}
                            </pre>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color] || colors.emerald}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-extrabold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  );
}
