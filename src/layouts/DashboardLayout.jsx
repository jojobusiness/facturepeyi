import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
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

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* SIDEBAR TOUJOURS FIXE À GAUCHE */}
      <aside className="w-64 bg-white p-4 shadow-lg flex flex-col min-h-screen">
        <h1 className="text-2xl font-bold text-[#1B5E20] mb-8 text-center">
          Factur'Peyi
        </h1>
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
      {/* CONTENU PRINCIPAL */}
      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </section>
    </div>
  );
}