import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export default function PlanComptable() {
  const [comptes, setComptes] = useState([]);
  const [factures, setFactures] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [nouveauCompte, setNouveauCompte] = useState("");
  const [type, setType] = useState("revenu");
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const fetchAll = async () => {
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
    };
    fetchAll();
  }, [uid]);

  const ajouterCompte = async () => {
    if (!nouveauCompte) return;
    const docRef = await addDoc(collection(db, "comptes"), {
      uid,
      nom: nouveauCompte,
      type,
      elements: [],
    });
    setComptes([...comptes, { id: docRef.id, nom: nouveauCompte, type, elements: [] }]);
    setNouveauCompte("");
  };

  const associerElement = async (compteId, elementId) => {
    const compte = comptes.find((c) => c.id === compteId);
    if (!compte.elements.includes(elementId)) {
      const updatedElements = [...compte.elements, elementId];
      await updateDoc(doc(db, "comptes", compteId), { elements: updatedElements });
      setComptes(
        comptes.map((c) =>
          c.id === compteId ? { ...c, elements: updatedElements } : c
        )
      );
    }
  };

  const supprimerCompte = async (compteId) => {
    const compte = comptes.find((c) => c.id === compteId);
    if (!compte) return;

    if (compte.elements.length > 0) {
      alert("Ce compte contient des éléments associés. Veuillez les détacher avant suppression.");
      return;
    }

    const confirm = window.confirm("Supprimer définitivement ce compte ?");
    if (!confirm) return;

    await deleteDoc(doc(db, "comptes", compteId));
    setComptes(comptes.filter((c) => c.id !== compteId));
  };

  return (
    <main className="p-4">
      <h2 className="text-2xl font-bold mb-4">📚 Plan Comptable</h2>

      <div className="flex gap-2 mb-6">
        <input
          placeholder="Nom du compte"
          value={nouveauCompte}
          onChange={(e) => setNouveauCompte(e.target.value)}
          className="border p-2 rounded"
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className="border p-2 rounded">
          <option value="revenu">Revenu</option>
          <option value="depense">Dépense</option>
        </select>
        <button
          onClick={ajouterCompte}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          ➕ Ajouter
        </button>
      </div>

      {comptes.map((compte) => (
        <div key={compte.id} className="bg-white shadow p-4 rounded mb-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">
              {compte.nom} ({compte.type})
            </h3>
            <button
              onClick={() => supprimerCompte(compte.id)}
              className="text-red-600 text-sm hover:underline"
            >
              🗑 Supprimer
            </button>
          </div>

          <ul className="mt-2 ml-4 list-disc text-sm">
            {compte.elements.map((eid) => {
              const source = compte.type === "revenu" ? factures : depenses;
              const elt = source.find((e) => e.id === eid);
              return (
                <li key={eid}>
                  {elt?.description || elt?.fournisseur || "Élément inconnu"} - {elt?.montantTTC || elt?.totalTTC || 0} €
                </li>
              );
            })}
          </ul>

          <div className="mt-4">
            <label className="block font-medium mb-1">Associer un élément :</label>
            <select
              onChange={(e) => associerElement(compte.id, e.target.value)}
              className="border p-2 rounded"
              defaultValue=""
            >
              <option value="">-- Choisir une facture/dépense --</option>
              {(compte.type === "revenu" ? factures : depenses).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.description || e.fournisseur} - {e.montantTTC || e.totalTTC || 0} €
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </main>
  );
}