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
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <main className="min-h-screen bg-gray-100 flex">
      {/* Bouton hamburger mobile */}
      <button
        className="fixed top-4 left-4 z-30 bg-white shadow md:hidden p-2 rounded-xl"
        onClick={() => setOpen(true)}
      >
        <span className="text-2xl">☰</span>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 bg-white shadow-lg p-4 flex flex-col transform transition-transform
          w-64
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:w-64 md:flex
        `}
        style={{ minWidth: "16rem" }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#1B5E20] text-center w-full">Factur'Peyi</h1>
          {/* Bouton close (mobile) */}
          <button
            className="md:hidden absolute top-4 right-4"
            onClick={() => setOpen(false)}
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          {menuItems.map(item =>
            item.key === "logout" ? (
              <button
                key={item.key}
                onClick={handleLogout}
                className="mt-8 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded font-semibold"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.key}
                to={item.to}
                className={`text-left px-4 py-3 rounded-xl font-medium hover:bg-[#E8F5E9] transition ${
                  location.pathname === item.to
                    ? "bg-[#C8E6C9] text-[#1B5E20]"
                    : "text-gray-700"
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>
      </aside>

      {/* Overlay sombre sur mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main content */}
      <section className="flex-1 p-4 md:p-8 ml-0 md:ml-64 transition-all">
        <Outlet />
      </section>
    </main>
  );
}