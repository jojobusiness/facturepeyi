import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]                         = useState(null);
  const [entreprise, setEntreprise]             = useState(null);
  const [entrepriseId, setEntrepriseId]         = useState(null);
  const [managedEntreprises, setManagedEntreprises] = useState([]);
  const [isCabinet, setIsCabinet]               = useState(false);
  const [loading, setLoading]                   = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // 1. Charger le profil utilisateur
          const userSnap = await getDoc(doc(db, "utilisateurs", firebaseUser.uid));
          const userData  = userSnap.data();
          const eid       = userData?.entrepriseId || null;
          if (!eid) { setLoading(false); return; }

          // 2. Charger la propre entreprise de l'utilisateur
          const ownSnap = await getDoc(doc(db, "entreprises", eid));
          if (!ownSnap.exists()) { setLoading(false); return; }
          const ownData = { id: eid, ...ownSnap.data() };

          if (ownData.plan === "cabinet") {
            // ── Mode Cabinet ──────────────────────────────────────────────────
            setIsCabinet(true);

            // Charger toutes les entreprises gérées par ce cabinet
            const q    = query(collection(db, "entreprises"), where("cabinetUid", "==", firebaseUser.uid));
            const snap = await getDocs(q);
            const managed = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setManagedEntreprises(managed);

            // Entreprise active = localStorage → première managée → propre entreprise
            const storedId    = localStorage.getItem(`cabinet_active_${firebaseUser.uid}`);
            const validStored = managed.find(e => e.id === storedId);

            if (validStored) {
              setEntreprise(validStored);
              setEntrepriseId(validStored.id);
            } else if (managed.length > 0) {
              setEntreprise(managed[0]);
              setEntrepriseId(managed[0].id);
              localStorage.setItem(`cabinet_active_${firebaseUser.uid}`, managed[0].id);
            } else {
              setEntreprise(ownData);
              setEntrepriseId(eid);
            }
          } else {
            // ── Mode standard ─────────────────────────────────────────────────
            setIsCabinet(false);
            setManagedEntreprises([]);
            setEntreprise(ownData);
            setEntrepriseId(eid);
          }
        } catch (err) {
          console.error("Erreur chargement entreprise :", err);
        }
      } else {
        setEntreprise(null);
        setEntrepriseId(null);
        setManagedEntreprises([]);
        setIsCabinet(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshEntreprise = async () => {
    if (!entrepriseId) return;
    try {
      const snap = await getDoc(doc(db, "entreprises", entrepriseId));
      if (snap.exists()) setEntreprise({ id: entrepriseId, ...snap.data() });
    } catch (err) {
      console.error("Erreur refresh entreprise :", err);
    }
  };

  // Switcher d'entreprise pour le plan Cabinet
  const switchEntreprise = async (id) => {
    try {
      if (user) localStorage.setItem(`cabinet_active_${user.uid}`, id);
      const snap = await getDoc(doc(db, "entreprises", id));
      if (snap.exists()) {
        setEntreprise({ id, ...snap.data() });
        setEntrepriseId(id);
      }
    } catch (err) {
      console.error("Erreur switch entreprise :", err);
    }
  };

  // Recharge la liste des entreprises gérées (après ajout d'un client)
  const refreshManagedEntreprises = async () => {
    if (!user || !isCabinet) return;
    try {
      const q    = query(collection(db, "entreprises"), where("cabinetUid", "==", user.uid));
      const snap = await getDocs(q);
      setManagedEntreprises(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Erreur refresh managed entreprises :", err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      entreprise,
      entrepriseId,
      managedEntreprises,
      isCabinet,
      loading,
      refreshEntreprise,
      switchEntreprise,
      refreshManagedEntreprises,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error("useAuth() appelé en dehors de AuthProvider");
    return { user: null, entreprise: null, entrepriseId: null, managedEntreprises: [], isCabinet: false, loading: true };
  }
  return context;
}
