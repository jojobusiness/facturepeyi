import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import {
  FaHome, FaFileInvoice, FaPlus, FaUsers, FaFileAlt,
  FaReceipt, FaTag, FaBook, FaBalanceScale, FaChartBar,
  FaFilePdf, FaUserShield, FaCog, FaSignOutAlt, FaBars, FaTimes,
  FaChevronDown, FaChevronRight, FaBuilding,
} from "react-icons/fa";

// ─── Structure du menu ────────────────────────────────────────────────────────

const nav = [
  {
    section: null,
    items: [
      { key: "dashboard", label: "Tableau de bord", icon: <FaHome />, to: "/dashboard" },
    ],
  },
  {
    section: "Ventes",
    items: [
      { key: "factures",       label: "Factures",          icon: <FaFileInvoice />, to: "/dashboard/factures" },
      { key: "nouvelleFacture",label: "Nouvelle facture",  icon: <FaPlus />,        to: "/dashboard/facture/nouvelle", accent: true },
      { key: "clients",        label: "Clients",           icon: <FaUsers />,       to: "/dashboard/clients" },
      { key: "devis",          label: "Devis",             icon: <FaFileAlt />,     to: "/dashboard/devis", badge: "Bientôt" },
    ],
  },
  {
    section: "Achats",
    items: [
      { key: "depenses",    label: "Dépenses",    icon: <FaReceipt />, to: "/dashboard/depenses" },
      { key: "categories",  label: "Catégories",  icon: <FaTag />,     to: "/dashboard/categories" },
    ],
  },
  {
    section: "Comptabilité",
    items: [
      { key: "journal",     label: "Journal",          icon: <FaBook />,         to: "/dashboard/journalcomptable" },
      { key: "bilan",       label: "Bilan",             icon: <FaBalanceScale />, to: "/dashboard/bilancomptable" },
      { key: "plan",        label: "Plan comptable",    icon: <FaChartBar />,     to: "/dashboard/plancomptable" },
      { key: "declaration", label: "Déclaration TVA",   icon: <FaFilePdf />,      to: "/dashboard/declarationfiscale" },
      { key: "rapports",    label: "Rapports",          icon: <FaFilePdf />,      to: "/dashboard/rapports" },
    ],
  },
  {
    section: "Équipe",
    items: [
      { key: "admin",      label: "Gestion utilisateurs", icon: <FaUserShield />, to: "/dashboard/admin" },
      { key: "parametres", label: "Paramètres",           icon: <FaCog />,        to: "/dashboard/parametres" },
    ],
  },
];

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, entreprise } = useAuth();
  const [collapsed, setCollapsed] = useState({});

  const isActive = (to) => location.pathname === to;

  const toggleSection = (section) =>
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1b3e] text-white w-64">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div>
          <div className="font-black text-lg text-white tracking-tight">Factur'Peyi</div>
          <div className="text-emerald-400 text-xs font-medium">Gérez. Facturez. Encaissez.</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white p-1 transition">
            <FaTimes className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Entreprise badge */}
      {entreprise?.nom && (
        <div className="mx-3 mt-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <FaBuilding className="w-3 h-3 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{entreprise.nom}</div>
            <div className="text-xs text-white/40 truncate">{entreprise.territoire || "DOM-TOM"}</div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {nav.map(({ section, items }) => (
          <div key={section || "home"} className="mb-1">
            {section && (
              <button
                onClick={() => toggleSection(section)}
                className="w-full flex items-center justify-between px-2 py-1.5 mb-1 text-left"
              >
                <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">
                  {section}
                </span>
                {collapsed[section]
                  ? <FaChevronRight className="w-2.5 h-2.5 text-white/30" />
                  : <FaChevronDown className="w-2.5 h-2.5 text-white/30" />}
              </button>
            )}
            {!collapsed[section] && items.map((item) => (
              item.badge ? (
                <div
                  key={item.key}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 cursor-not-allowed select-none"
                >
                  <span className="w-4 h-4 flex-shrink-0 text-white/20">{item.icon}</span>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <span className="text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded-full font-medium">
                    {item.badge}
                  </span>
                </div>
              ) : (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                    isActive(item.to)
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                      : item.accent
                        ? "text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-300"
                        : "text-white/60 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <span className={`w-4 h-4 flex-shrink-0 ${isActive(item.to) ? "text-white" : ""}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            ))}
          </div>
        ))}
      </nav>

      {/* Utilisateur + logout */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">{user?.email}</div>
            <div className="text-xs text-white/40">Connecté</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition text-sm font-medium"
        >
          <FaSignOutAlt className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

// ─── Layout principal ─────────────────────────────────────────────────────────

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex relative">

      {/* ── Sidebar fixe desktop ── */}
      <aside className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* ── Overlay mobile ── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-full z-50 md:hidden shadow-2xl">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* ── Topbar mobile ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm h-14 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900 transition p-1"
          >
            <FaBars className="w-5 h-5" />
          </button>
          <span className="font-black text-[#0d1b3e] text-lg tracking-tight">Factur'Peyi</span>
        </header>

        {/* ── Contenu ── */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
