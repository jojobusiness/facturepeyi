import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Papa from "papaparse";
import {
  parseMontantFR, parseDateFR, pickField, normalizeStatut,
} from "../utils/importCompta";

const STATUS_BADGES = {
  "payée":      "bg-emerald-50 text-emerald-700",
  "en attente": "bg-yellow-50 text-yellow-700",
  "en retard":  "bg-red-50 text-red-600",
  "annulée":    "bg-gray-100 text-gray-500",
};

export default function ImportFactures() {
  const { entreprise, entrepriseId } = useAuth();
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row) => {
          const clientNom = pickField(row, ["client", "clientnom", "nom", "nomclient", "tiers"]);
          const description = pickField(row, ["description", "prestation", "objet", "libelle", "detail"]);
          const totalTTC = parseMontantFR(pickField(row, ["montant", "total", "ttc", "montantttc", "totalttc"]));
          const tvaStr = pickField(row, ["tva", "tauxtva", "tauxdetva"]);
          const tvaRate = tvaStr ? parseMontantFR(tvaStr) : 0;
          const amountHT = tvaRate > 0 ? parseFloat((totalTTC / (1 + tvaRate / 100)).toFixed(2)) : totalTTC;
          const date = parseDateFR(pickField(row, ["date", "datefacture", "dateemission"]));
          const numero = pickField(row, ["numero", "num", "ref", "reference", "numerofacture"]);
          const status = normalizeStatut(pickField(row, ["statut", "status", "etat", "paiement"]));
          return {
            clientNom, description, totalTTC, tvaRate, amountHT, date, numero, status,
            valid: totalTTC > 0 && !!date && !!clientNom,
          };
        });
        setRows(parsed);
      },
    });
  };

  const handleImport = async () => {
    if (!rows || !entrepriseId) return;
    setImporting(true);
    try {
      let count = 0;
      let errors = 0;
      for (const r of rows) {
        if (!r.valid) { errors++; continue; }
        try {
          // Factures HISTORIQUES : le numéro d'origine est conservé tel quel
          // (on ne renumérote jamais des factures déjà émises — la numérotation
          // séquentielle FAC-AAAA-0001 ne s'applique qu'aux nouvelles factures).
          await addDoc(collection(db, "entreprises", entrepriseId, "factures"), {
            clientId: "",
            clientNom: r.clientNom,
            clientEmail: "",
            description: r.description,
            amountHT: r.amountHT,
            tva: parseFloat((r.totalTTC - r.amountHT).toFixed(2)),
            totalTTC: r.totalTTC,
            tvaRate: r.tvaRate,
            mentionLegale: entreprise?.mentionLegale || "",
            date: Timestamp.fromDate(r.date),
            status: r.status,
            createdAt: Timestamp.now(),
            entrepriseId,
            ...(r.numero ? { numero: r.numero } : {}),
            imported: true,
          });
          count++;
        } catch (err) {
          console.error("Erreur import ligne :", err);
          errors++;
        }
      }
      setResult({ count, errors });
      setRows(null);
    } catch (err) {
      console.error("Erreur import :", err);
      alert("Erreur lors de l'import.");
    } finally {
      setImporting(false);
    }
  };

  const validCount = rows ? rows.filter((r) => r.valid).length : 0;

  return (
    <main className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Importer mon historique de factures</h2>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          Récupérez votre historique Excel sans rien ressaisir : exportez-le en <strong>CSV</strong> et importez-le ici.
          Colonnes reconnues : <code className="font-mono">client, description, montant, date, statut, numero, tva</code>{" "}
          — formats français acceptés (<code className="font-mono">12,50</code> · <code className="font-mono">13/07/2026</code> · séparateur <code className="font-mono">;</code>).
          Votre chiffre d'affaires apparaît immédiatement dans le tableau de bord.
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
          Les numéros de vos anciennes factures sont conservés tels quels (obligation légale : on ne renumérote
          jamais une facture déjà émise). La numérotation automatique FAC-{new Date().getFullYear()}-0001 s'applique
          uniquement aux nouvelles factures créées dans Factur'Peyi.
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">Fichier CSV</label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={(e) => handleFile(e.target.files[0])}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </div>

        {rows && (
          <>
            <div className="text-sm text-gray-500">
              <strong className="text-[#0d1b3e]">{fileName}</strong> — {validCount} facture{validCount !== 1 ? "s" : ""} prête{validCount !== 1 ? "s" : ""} sur {rows.length}
              {validCount < rows.length && (
                <span className="text-amber-600"> ({rows.length - validCount} ignorée{rows.length - validCount !== 1 ? "s" : ""} : client, montant ou date illisible)</span>
              )}
            </div>

            <div className="border border-gray-100 rounded-xl overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 sticky top-0">
                    {["N°", "Client", "Description", "Total TTC", "Date", "Statut"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r, i) => (
                    <tr key={i} className={r.valid ? "" : "opacity-40 line-through"}>
                      <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{r.numero || "—"}</td>
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">{r.clientNom || "—"}</td>
                      <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate">{r.description || "—"}</td>
                      <td className="px-4 py-2.5 font-semibold whitespace-nowrap">{r.totalTTC.toFixed(2)} €</td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{r.date ? r.date.toLocaleDateString("fr-FR") : "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGES[r.status]}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {result && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
            {result.count} facture{result.count !== 1 ? "s" : ""} importée{result.count !== 1 ? "s" : ""} avec succès
            {result.errors > 0 ? ` (${result.errors} ligne${result.errors !== 1 ? "s" : ""} ignorée${result.errors !== 1 ? "s" : ""})` : ""}.
            {" "}Votre chiffre d'affaires est à jour dans le <button onClick={() => navigate("/dashboard")} className="underline font-semibold">tableau de bord</button>.
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!rows || validCount === 0 || importing}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
        >
          {importing ? "Import en cours..." : `Importer ${validCount > 0 ? `${validCount} facture${validCount !== 1 ? "s" : ""}` : ""}`}
        </button>

        <button
          onClick={() => navigate("/dashboard/factures")}
          className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
        >
          ← Retour aux factures
        </button>
      </div>
    </main>
  );
}
