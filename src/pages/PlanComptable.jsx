import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function PlanComptable() {
  const { entrepriseId } = useAuth();
  const [comptes, setComptes] = useState([]);
  const [factures, setFactures] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [nouveauCompte, setNouveauCompte] = useState("");
  const [type, setType] = useState("revenu");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entrepriseId) return;
    const fetchAll = async () => {
      const [comptesSnap, factureSnap, depenseSnap] = await Promise.all([
        getDocs(collection(db, "entreprises", entrepriseId, "comptes")),
        getDocs(collection(db, "entreprises", entrepriseId, "factures")),
        getDocs(collection(db, "entreprises", entrepriseId, "depenses")),
      ]);
      setComptes(comptesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setFactures(factureSnap.docs.map((d) => ({ id: d.id, ...d.data(), type: "facture" })));
      setDepenses(depenseSnap.docs.map((d) => ({ id: d.id, ...d.data(), type: "depense" })));
      setLoading(false);
    };
    fetchAll();
  }, [entrepriseId]);

  const ajouterCompte = async () => {
    if (!nouveauCompte.trim() || !entrepriseId) return;
    const ref = await addDoc(collection(db, "entreprises", entrepriseId, "comptes"), {
      nom: nouveauCompte.trim(),
      type,
      elements: [],
      entrepriseId,
    });
    setComptes([...comptes, { id: ref.id, nom: nouveauCompte.trim(), type, elements: [] }]);
    setNouveauCompte("");
  };

  const associerElement = async (compteId, elementId) => {
    if (!elementId) return;
    const compte = comptes.find((c) => c.id === compteId);
    if (!compte || compte.elements.includes(elementId)) return;
    const updatedElements = [...compte.elements, elementId];
    await updateDoc(doc(db, "entreprises", entrepriseId, "comptes", compteId), { elements: updatedElements });
    setComptes(comptes.map((c) => c.id === compteId ? { ...c, elements: updatedElements } : c));
  };

  const retirerElement = async (compteId, elementId) => {
    const compte = comptes.find((c) => c.id === compteId);
    if (!compte) return;
    const updatedElements = compte.elements.filter((id) => id !== elementId);
    await updateDoc(doc(db, "entreprises", entrepriseId, "comptes", compteId), { elements: updatedElements });
    setComptes(comptes.map((c) => c.id === compteId ? { ...c, elements: updatedElements } : c));
  };

  const supprimerCompte = async (compteId) => {
    if (!window.confirm("Supprimer ce compte comptable ?")) return;
    await deleteDoc(doc(db, "entreprises", entrepriseId, "comptes", compteId));
    setComptes(comptes.filter((c) => c.id !== compteId));
  };

  const inputClass = "border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement...</div>;

  return (
    <main>
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Plan comptable</h2>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-6">
        <h3 className="text-sm font-bold text-[#0d1b3e] mb-4">Ajouter un compte</h3>
        <div className="flex gap-3">
          <input
            placeholder="Nom du compte (ex: 706 - Ventes)"
            value={nouveauCompte}
            onChange={(e) => setNouveauCompte(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ajouterCompte()}
            className={`flex-1 ${inputClass}`}
          />
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            <option value="revenu">Revenu</option>
            <option value="depense">Dépense</option>
          </select>
          <button
            onClick={ajouterCompte}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition whitespace-nowrap"
          >
            + Ajouter
          </button>
        </div>
      </div>

      {comptes.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <p className="text-gray-500 font-medium">Aucun compte comptable</p>
          <p className="text-gray-400 text-sm mt-1">Créez vos comptes pour structurer votre comptabilité</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comptes.map((compte) => {
            const allElements = [...factures, ...depenses];
            return (
              <div key={compte.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-[#0d1b3e]">{compte.nom}</h3>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${compte.type === "revenu" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {compte.type === "revenu" ? "Revenu" : "Dépense"}
                    </span>
                  </div>
                  <button onClick={() => supprimerCompte(compte.id)} className="text-xs font-medium text-red-400 hover:text-red-600 transition">
                    Supprimer
                  </button>
                </div>

                {compte.elements.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {compte.elements.map((eid) => {
                      const elt = allElements.find((e) => e.id === eid);
                      return (
                        <li key={eid} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 text-sm">
                          <span className="text-[#0d1b3e]">
                            <span className="text-xs font-semibold text-gray-400 mr-2">
                              {elt?.type === "facture" ? "Facture" : "Dépense"}
                            </span>
                            {elt?.description || elt?.fournisseur || "Élément inconnu"}
                            <span className="text-gray-400 ml-2">{elt?.totalTTC || elt?.montantTTC || 0} €</span>
                          </span>
                          <button onClick={() => retirerElement(compte.id, eid)} className="text-xs font-medium text-red-400 hover:text-red-600 ml-4 transition">
                            Retirer
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Associer un élément</label>
                  <select
                    onChange={(e) => { associerElement(compte.id, e.target.value); e.target.value = ""; }}
                    className={`w-full ${inputClass}`}
                    defaultValue=""
                  >
                    <option value="">-- Choisir une facture ou une dépense --</option>
                    {allElements.filter((e) => !compte.elements.includes(e.id)).map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.type === "facture" ? "Facture" : "Dépense"} — {e.description || e.fournisseur} — {e.totalTTC || e.montantTTC || 0} €
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
