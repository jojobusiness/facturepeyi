import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Link, Outlet , useNavigate} from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div>
      <nav style={{ padding: 10, background: "#eee", marginBottom: 20 }}>
        <Link to="/dashboard" style={{ margin: 10 }}>🏠 Dashboard</Link>
        <Link to="/facture/nouvelle" style={{ margin: 10 }}>➕ Nouvelle facture</Link>
        <Link to="/factures" style={{ margin: 10 }}>📁 Mes factures</Link>
        <Link to="/clients" style={{ margin: 10 }}>👥 Clients</Link>
        <Link to="/parametres" style={{ margin: 10 }}>⚙️ Paramètres</Link>
        <button onClick={handleLogout} style={{ margin: 10 }}>🔓 Déconnexion</button>
      </nav>
      <div style={{ padding: 20 }}>
        <Outlet /> {/* ← c'est ici que s'affiche la page active */}
      </div>
    </div>
  );
}