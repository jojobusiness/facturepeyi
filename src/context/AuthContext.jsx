import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [entreprise, setEntreprise] = useState(null);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userSnap = await getDoc(doc(db, "utilisateurs", firebaseUser.uid));
          const userData = userSnap.data();
          const eid = userData?.entrepriseId || null;
          setEntrepriseId(eid);
          if (eid) {
            const entrepriseSnap = await getDoc(doc(db, "entreprises", eid));
            if (entrepriseSnap.exists()) {
              setEntreprise({ id: eid, ...entrepriseSnap.data() });
            }
          }
        } catch (err) {
          console.error("Erreur chargement entreprise :", err);
        }
      } else {
        setEntreprise(null);
        setEntrepriseId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Permet de rafraîchir les données entreprise après modification (ex: Settings)
  const refreshEntreprise = async () => {
    if (!entrepriseId) return;
    try {
      const snap = await getDoc(doc(db, "entreprises", entrepriseId));
      if (snap.exists()) setEntreprise({ id: entrepriseId, ...snap.data() });
    } catch (err) {
      console.error("Erreur refresh entreprise :", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, entreprise, entrepriseId, loading, refreshEntreprise }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error("useAuth() appelé en dehors de AuthProvider");
    return { user: null, entreprise: null, entrepriseId: null, loading: true };
  }
  return context;
}
