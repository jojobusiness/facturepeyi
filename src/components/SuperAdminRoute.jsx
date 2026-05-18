import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

export default function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth();
  const [check, setCheck] = useState({ status: "idle", isSuperAdmin: false });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setCheck({ status: "done", isSuperAdmin: false });
      return;
    }
    let cancelled = false;
    getDoc(doc(db, "utilisateurs", user.uid))
      .then((snap) => {
        if (cancelled) return;
        setCheck({ status: "done", isSuperAdmin: snap.data()?.superAdmin === true });
      })
      .catch(() => {
        if (cancelled) return;
        setCheck({ status: "done", isSuperAdmin: false });
      });
    return () => { cancelled = true; };
  }, [user, loading]);

  if (loading || check.status === "idle") {
    return <LoadingScreen message="Vérification des droits..." />;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!check.isSuperAdmin) return <Navigate to="/unauthorized" replace />;
  return children;
}
