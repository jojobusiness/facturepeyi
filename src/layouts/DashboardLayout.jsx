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
    <main className="min-h-screen bg-gray-100 flex flex-col">
      {/* ---- TOPBAR ---- */}
      <header className="w-full h-16 bg-white shadow flex items-center justify-between px-4 md:px-8 fixed z-40 top-0 left-0 right-0">
        {/* Bouton menu mobile */}
        <button
          className="md:hidden text-2xl mr-2"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#1B5E20] text-xl">Factur'Peyi</span>
        </div>
        {/* Déconnexion à droite */}
        <button
          onClick={handleLogout}
          className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded font-semibold ml-2"
        >
          🔓 Déconnexion
        </button>
      </header>

      {/* ---- SIDEBAR ---- */}
      <aside
        className={`
          fixed z-30 top-0 left-0 h-full bg-white shadow-lg p-4 pt-20 flex flex-col
          w-64 transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:p-4 md:pt-8
        `}
        style={{ minWidth: "16rem" }}
      >
        {/* Bouton close mobile */}
        <button
          className="md:hidden absolute top-4 right-4"
          onClick={() => setSidebarOpen(false)}
        >
          <span className="text-xl">✕</span>
        </button>
        <nav className="flex flex-col gap-2 flex-1">
          {menuItems.map(item => (
            <Link
              key={item.key}
              to={item.to}
              className={`text-left px-4 py-3 rounded-xl font-medium hover:bg-[#E8F5E9] transition ${
                location.pathname === item.to
                  ? "bg-[#C8E6C9] text-[#1B5E20]"
                  : "text-gray-700"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Overlay sombre sur mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ---- MAIN CONTENT ---- */}
      <section
        className="flex-1 mt-16 md:ml-64 p-4 md:p-8 transition-all"
        style={{ minHeight: "calc(100vh - 4rem)" }}
      >
        <Outlet />
      </section>
    </main>
  );
}