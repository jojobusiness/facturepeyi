import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

const menuItems = [
  { key: "dashboard", label: "📊 Statistiques", to: "/dashboard" },
  { key: "factures", label: "📁 Mes factures", to: "/dashboard/factures" },
  { key: "nouvelleFacture", label: "➕ Créer une facture", to: "/dashboard/facture/nouvelle" },
  { key: "clients", label: "👥 Mes clients", to: "/dashboard/clients" },
  { key: "depenses", label: "📦 Dépenses", to: "/dashboard/depenses" },
  { key: "declarationfiscale", label: "📄 Déclaration fiscale", to: "/dashboard/declarationfiscale" },
  { key: "plancomptable", label: "📚 Plan Comptable", to: "/dashboard/plancomptable" },
  { key: "bilancomptable", label: "📊 Bilan Comptable", to: "/dashboard/bilancomptable" },
  { key: "journalcomptable", label: "📘 Journal Comptable", to: "/dashboard/journalcomptable" },
  { key: "categories", label: "📂 Gérer mes catégories", to: "/dashboard/categories" },
  { key: "admin", label: "⚙️ Admin", to: "/dashboard/admin" },
  { key: "parametres", label: "⚙️ Paramètres", to: "/dashboard/parametres" },
  { key: "rapports", label: "📄 Rapports PDF", to: "/dashboard/rapports" },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex relative">
      {/* BOUTON OUVERTURE SIDEBAR (mobile uniquement) */}
      <button
        className="fixed top-4 left-4 z-40 md:hidden bg-white rounded-full p-2 shadow-lg border border-gray-100"
        onClick={() => setSidebarOpen(true)}
        aria-label="Ouvrir le menu"
      >
        <span className="text-2xl text-[#1B5E20]">☰</span>
      </button>

      {/* SIDEBAR - toujours visible sur md+, slide sur mobile */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white p-4 shadow-lg flex-col z-50 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:static md:translate-x-0 md:flex
      `}>
        {/* Titre + bouton fermeture sur mobile */}
        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-2xl font-bold text-[#1B5E20] cursor-pointer"
            onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false); }}
          >
            Factur'Peyi
          </h1>
          {/* Bouton fermer (mobile uniquement) */}
          <button
            className="md:hidden text-2xl p-2"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          {menuItems.map(item => (
            <Link
              key={item.key}
              to={item.to}
              className={`text-left px-4 py-3 rounded-xl font-medium hover:bg-[#E8F5E9] transition ${
                location.pathname === item.to ? "bg-[#C8E6C9] text-[#1B5E20]" : "text-gray-700"
              }`}
              onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false); }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-6 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded font-semibold"
        >
          🔓 Déconnexion
        </button>
      </aside>

      {/* OVERLAY (mobile uniquement, quand menu ouvert) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* CONTENU PRINCIPAL */}
      <section className="flex-1 p-4 md:p-8 overflow-y-auto ml-0 md:ml-64 transition-all duration-300">
        <Outlet />
      </section>
    </div>
  );
}