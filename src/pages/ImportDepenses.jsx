import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import Papa from "papaparse";

export default function ImportDepenses() {
  const [csvFile, setCsvFile] = useState(null);

  const handleImport = async () => {
    if (!csvFile) return;
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        for (const row of rows) {
          try {
            await addDoc(collection(db, "depenses"), {
              fournisseur: row.fournisseur,
              description: row.description,
              montant: parseFloat(row.montant),
              date: Timestamp.fromDate(new Date(row.date)),
              createdAt: Timestamp.now(),
            });
          } catch (err) {
            console.error("Erreur d'import :", err);
          }
        }
        alert("Import terminé !");
      },
    });
  };

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📥 Importer des dépenses</h2>
      <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
      <button onClick={handleImport} className="mt-4 bg-[#1B5E20] text-white px-4 py-2 rounded">
        Importer
      </button>
      <button onClick={() => navigate('/depenses')} className="mt-4 text-blue-600 underline">← Retour à la liste</button>
    </main>
  );
}