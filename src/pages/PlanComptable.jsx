import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PlanComptable() {
  const [comptes, setComptes] = useState([]);
  const [factures, setFactures] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [nouveauCompte, setNouveauCompte] = useState("");
  const [type, setType] = useState("revenu");
  const [uid, setUid] = useState(null);

  // Attendre que l'utilisateur soit chargé
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
    });
    return () => unsubscribe();
  }, []);

  // Charger comptes, factures, dépenses
  useEffect(() => {
    if (!uid) return;
    const fetchAll = async () => {
      try {
        const compteSnap = await getDocs(
          query(collection(db, "comptes"), where("uid", "==", uid))
        );
        setComptes(compteSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        const factureSnap = await getDocs(
          query(collection(db, "factures"), where("uid", "==", uid))
        );
        setFactures(factureSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        const depenseSnap = await getDocs(
          query(collection(db, "depenses"), where("uid", "==", uid))
        );
        setDepenses(depenseSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Erreur chargement données :", err);
      }
    };

    fetchAll();
  }, [uid]);

  // Ajouter un compte
  const ajouterCompte = async () => {
    if (!nouveauCompte || !uid) return;

    try {
      const docRef = await addDoc(collection(db, "comptes"), {
        uid,
        nom: nouveauCompte,
        type,
        elements: [],
      });

      setComptes([...comptes, { id: docRef.id, nom: nouveauCompte, type, elements: [] }]);
      setNouveauCompte("");
    } catch (err) {
      console.error("Erreur lors de l'ajout du compte :", err);
      alert("Erreur lors de l'ajout du compte.");
    }
  };

  // Associer un élément (facture/dépense) à un compte
  const associerElement = async (compteId, elementId) => {
    const compte = comptes.find((c) => c.id === compteId);
    if (!compte || compte.elements.includes(elementId)) return;

    const updatedElements = [...compte.elements, elementId];

    try {
      await updateDoc(doc(db, "comptes", compteId), { elements: updatedElements });
      setComptes(comptes.map((c) => (c.id === compteId ? { ...c, elements: updatedElements } : c)));
    } catch (err) {
      console.error("Erreur association élément :", err);
    }
  };

  if (!uid) return <p className="p-4">Chargement de l'utilisateur...</p>;

  return (
    <main className="p-4">
      <h2 className="text-2xl font-bold mb-4">📚 Plan Comptable</h2>

      {/* Formulaire d'ajout */}
      <div className="flex gap-2 mb-6">
        <input
          placeholder="Nom du compte"
          value={nouveauCompte}
          onChange={(e) => setNouveauCompte(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="revenu">Revenu</option>
          <option value="depense">Dépense</option>
        </select>
        <button
          onClick={ajouterCompte}
          disabled={!nouveauCompte || !uid}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Ajouter
        </button>
      </div>

      {/* Liste des comptes */}
      {comptes.map((compte) => (
        <div key={compte.id} className="bg-white shadow p-4 rounded mb-4">
          <h3 className="font-semibold text-lg">
            {compte.nom} ({compte.type})
          </h3>

          {/* Liste des éléments associés */}
          <ul className="mt-2 ml-4 list-disc">
            {compte.elements.map((eid) => {
              const source = compte.type === "revenu" ? factures : depenses;
              const elt = source.find((e) => e.id === eid);
              return (
                <li key={eid} className="text-sm">
                  {elt?.description || elt?.fournisseur || "Élément inconnu"} –{" "}
                  {elt?.montantTTC || elt?.totalTTC || 0} €
                </li>
              );
            })}
          </ul>

          {/* Sélecteur pour associer */}
          <div className="mt-4">
            <label className="block font-medium mb-1">Associer un élément :</label>
            <select
              onChange={(e) => associerElement(compte.id, e.target.value)}
              className="border p-2 rounded w-full"
              defaultValue=""
            >
              <option value="">-- Choisir une facture ou dépense --</option>
              {(compte.type === "revenu" ? factures : depenses)
                .filter((e) => !compte.elements.includes(e.id))
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.description || e.fournisseur} – {e.montantTTC || e.totalTTC || 0} €
                  </option>
                ))}
            </select>
          </div>
        </div>
      ))}
    </main>
  );
}