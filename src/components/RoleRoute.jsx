import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserRole } from "../utils/auth";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

export default function RoleRoute({ children, allowedRoles = [] }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    setChecking(true);
    fetchUserRole(user.uid)
      .then((r) => setRole(r || "employe"))
      .catch(() => setRole(null))
      .finally(() => setChecking(false));
  }, [user]);

  if (authLoading || checking) return <LoadingScreen message="Vérification des autorisations..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;
  return children;
}
