import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Papa from "papaparse";

export default function ImportDepenses() {
  const { entrepriseId } = useAuth();
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleImport = async () => {
    if (!csvFile || !entrepriseId) return;
    setLoading(true);
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let count = 0;
        for (const row of results.data) {
          try {
            await addDoc(collection(db, "entreprises", entrepriseId, "depenses"), {
              fournisseur: row.fournisseur || "",
              description: row.description || "",
              montantHT: parseFloat(row.montant) || 0,
              montantTTC: parseFloat(row.montant) || 0,
              date: Timestamp.fromDate(new Date(row.date)),
              createdAt: Timestamp.now(),
              entrepriseId,
            });
            count++;
          } catch (err) {
            console.error("Erreur import ligne :", err);
          }
        }
        setResult(count);
        setLoading(false);
      },
    });
  };

  return (
    <main className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Importer des dépenses</h2>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          Format CSV attendu : <code className="font-mono">fournisseur, description, montant, date</code>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">Fichier CSV</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => { setCsvFile(e.target.files[0]); setResult(null); }}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </div>

        {result !== null && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
            {result} dépense{result !== 1 ? "s" : ""} importée{result !== 1 ? "s" : ""} avec succès.
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!csvFile || loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
        >
          {loading ? "Import en cours..." : "Importer"}
        </button>

        <button
          onClick={() => navigate("/dashboard/depenses")}
          className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
        >
          ← Retour aux dépenses
        </button>
      </div>
    </main>
  );
}
