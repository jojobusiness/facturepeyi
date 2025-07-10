import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
} from "firebase/firestore";

export default function PlanComptable() {
  const [comptes, setComptes] = useState([]);
  const [factures, setFactures] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [nouveauCompte, setNouveauCompte] = useState("");
  const [type, setType] = useState("revenu");
  const [entrepriseId, setEntrepriseId] = useState(null);

  // 🔍 Charger entrepriseId lié à l’utilisateur
  useEffect(() => {
    const fetchEntrepriseId = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "utilisateurs", user.uid));
      if (snap.exists()) {
        setEntrepriseId(snap.data().entrepriseId);
      }
    };
    fetchEntrepriseId();
  }, []);

  // 📦 Charger comptes, factures, dépenses depuis entreprise
  useEffect(() => {
    const fetchAll = async () => {
      if (!entrepriseId) return;

      const comptesSnap = await getDocs(
        collection(db, "entreprises", entrepriseId, "comptes")
      );
      setComptes(comptesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const factureSnap = await getDocs(
        collection(db, "entreprises", entrepriseId, "factures")
      );
      setFactures(factureSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), type: "facture" })));

      const depenseSnap = await getDocs(
        collection(db, "entreprises", entrepriseId, "depenses")
      );
      setDepenses(depenseSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), type: "depense" })));
    };

    fetchAll();
  }, [entrepriseId]);

  const ajouterCompte = async () => {
    if (!nouveauCompte || !entrepriseId) return;
    const ref = await addDoc(collection(db, "entreprises", entrepriseId, "comptes"), {
      nom: nouveauCompte,
      type,
      elements: [],
      entrepriseId,
    });
    setComptes([...comptes, { id: ref.id, nom: nouveauCompte, type, elements: [] }]);
    setNouveauCompte("");
  };

  const associerElement = async (compteId, elementId) => {
    const compte = comptes.find((c) => c.id === compteId);
    if (!compte || compte.elements.includes(elementId)) return;

    const updatedElements = [...compte.elements, elementId];
    await updateDoc(doc(db, "entreprises", entrepriseId, "comptes", compteId), {
      elements: updatedElements,
    });

    setComptes(comptes.map((c) =>
      c.id === compteId ? { ...c, elements: updatedElements } : c
    ));
  };

  const retirerElement = async (compteId, elementId) => {
    const compte = comptes.find((c) => c.id === compteId);
    if (!compte) return;

    const updatedElements = compte.elements.filter((id) => id !== elementId);
    await updateDoc(doc(db, "entreprises", entrepriseId, "comptes", compteId), {
      elements: updatedElements,
    });

    setComptes(comptes.map((c) =>
      c.id === compteId ? { ...c, elements: updatedElements } : c
    ));
  };

  const supprimerCompte = async (compteId) => {
    if (!window.confirm("Supprimer ce compte comptable ?")) return;
    await deleteDoc(doc(db, "entreprises", entrepriseId, "comptes", compteId));
    setComptes(comptes.filter((c) => c.id !== compteId));
  };

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📒 Plan Comptable</h2>

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
              Supprimer
            </button>
          </div>

          <ul className="mt-2 ml-4 list-disc space-y-1">
            {compte.elements.map((eid) => {
              const source = [...factures, ...depenses];
              const elt = source.find((e) => e.id === eid);
              return (
                <li key={eid} className="flex justify-between items-center text-sm">
                  <span>
                    <span className="font-bold text-sm text-gray-600">
                      {elt?.type === "facture" ? "🧾 Facture" : "💸 Dépense"}
                    </span>{" "}
                    - {elt?.description || elt?.fournisseur || "Élément inconnu"} -{" "}
                    {elt?.totalTTC || elt?.montantTTC || 0} €
                  </span>
                  <button
                    onClick={() => retirerElement(compte.id, eid)}
                    className="text-red-600 hover:underline ml-4 text-xs"
                  >
                    ❌ Retirer
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4">
            <label className="block font-medium mb-1">Associer un élément :</label>
            <select
              onChange={(e) => associerElement(compte.id, e.target.value)}
              className="border p-2 rounded w-full"
              defaultValue=""
            >
              <option value="">-- Choisir une facture ou une dépense --</option>
              {[...factures, ...depenses]
                .filter((e) => !compte.elements.includes(e.id))
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.description || e.fournisseur} — {e.totalTTC || e.montantTTC || 0} €
                  </option>
                ))}
            </select>
          </div>
        </div>
      ))}
    </main>
  );
}