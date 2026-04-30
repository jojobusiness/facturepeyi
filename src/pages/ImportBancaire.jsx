import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { canUseFeature } from "../lib/plans";
import PlanGate from "../components/PlanGate";
import Papa from "papaparse";
import { FaUpload, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

// ─── Parser OFX ──────────────────────────────────────────────────────────────

function parseOFX(text) {
  const transactions = [];
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  for (const block of blocks) {
    const end = block.search(/<\/STMTTRN>/i);
    const content = end > -1 ? block.substring(0, end) : block;

    const get = (tag) => {
      const m = content.match(new RegExp(`<${tag}[^>]*>([^<\n\r]+)`, "i"));
      return m ? m[1].trim() : "";
    };

    const rawDate = get("DTPOSTED").replace(/[^0-9]/g, "").substring(0, 8);
    const date = rawDate.length === 8
      ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      : "";
    const amount = parseFloat(get("TRNAMT") || "0");
    const description = get("MEMO") || get("NAME") || "";

    if (description || amount !== 0) {
      transactions.push({ date, amount, description, type: get("TRNTYPE") });
    }
  }
  return transactions;
}

// ─── Composant preview ────────────────────────────────────────────────────────

function PreviewTable({ rows }) {
  if (!rows.length) return null;
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden text-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Description</th>
            <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Montant</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.slice(0, 8).map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 text-gray-500 text-xs">{row.date || "—"}</td>
              <td className="px-4 py-2.5 text-gray-700 truncate max-w-xs">{row.description}</td>
              <td className={`px-4 py-2.5 text-right font-semibold text-xs ${row.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
                {row.amount >= 0 ? "+" : ""}{row.amount.toFixed(2)} €
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 8 && (
        <div className="text-center text-xs text-gray-400 py-2 border-t border-gray-100">
          +{rows.length - 8} transactions supplémentaires
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ImportBancaire() {
  const { entreprise, entrepriseId } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("csv");
  const [categories, setCategories] = useState([]);
  const [categorieId, setCategorieId] = useState("");

  // CSV state
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [colDate, setColDate] = useState("");
  const [colDesc, setColDesc] = useState("");
  const [colMontant, setColMontant] = useState("");

  // OFX state
  const [ofxRows, setOfxRows] = useState([]);

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const allowed = canUseFeature(entreprise?.plan || "decouverte", "import-bancaire");

  useEffect(() => {
    if (!entrepriseId) return;
    getDocs(collection(db, "entreprises", entrepriseId, "categories"))
      .then((snap) => setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [entrepriseId]);

  // ── CSV ──
  const handleCSVFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResult(null); setError("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        setCsvHeaders(meta.fields || []);
        setCsvRows(data);
        const fields = meta.fields || [];
        setColDate(fields.find(f => /date/i.test(f)) || fields[0] || "");
        setColDesc(fields.find(f => /lib|desc|memo|label/i.test(f)) || fields[1] || "");
        setColMontant(fields.find(f => /mont|amount|debit|credit|sum/i.test(f)) || fields[2] || "");
      },
    });
  };

  const csvPreview = csvRows.map((row) => ({
    date: row[colDate] || "",
    description: row[colDesc] || "",
    amount: parseFloat((row[colMontant] || "0").toString().replace(",", ".")) || 0,
  }));

  // ── OFX ──
  const handleOFXFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResult(null); setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseOFX(ev.target.result);
      setOfxRows(rows);
    };
    reader.readAsText(file, "latin1");
  };

  // ── Import ──
  const handleImport = async () => {
    if (!entrepriseId) return;
    const rows = tab === "csv" ? csvPreview : ofxRows;
    if (!rows.length) return setError("Aucune transaction détectée.");

    setImporting(true); setError(""); setResult(null);
    let count = 0;
    for (const row of rows) {
      try {
        const parsedDate = row.date ? new Date(row.date) : new Date();
        if (isNaN(parsedDate.getTime())) continue;
        await addDoc(collection(db, "entreprises", entrepriseId, "depenses"), {
          fournisseur: row.description || "Import bancaire",
          description: row.description || "",
          montantHT: Math.abs(row.amount),
          montantTTC: Math.abs(row.amount),
          tauxTVA: 0,
          montantTVA: 0,
          montantOctroiDeMer: 0,
          categorieId: categorieId || "",
          date: Timestamp.fromDate(parsedDate),
          createdAt: Timestamp.now(),
          entrepriseId,
          sourceImport: tab,
        });
        count++;
      } catch (err) {
        console.error("Erreur import ligne :", err);
      }
    }
    setResult(count);
    setImporting(false);
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";
  const activeTab = "border-b-2 border-emerald-600 text-emerald-700 font-semibold";
  const inactiveTab = "text-gray-500 hover:text-gray-700";

  if (!allowed) {
    return (
      <main className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Import bancaire</h2>
        <PlanGate
          reason="L'import bancaire CSV/OFX est réservé au plan Expert."
          upgradeRequired="expert"
        />
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0d1b3e]">Import bancaire</h2>
        <button onClick={() => navigate("/dashboard/depenses")} className="text-sm text-gray-500 hover:text-gray-700 transition">
          ← Dépenses
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {["csv", "ofx"].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setResult(null); setError(""); }}
              className={`px-4 py-4 text-sm mr-4 transition ${tab === t ? activeTab : inactiveTab}`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">

          {/* Info format */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
            {tab === "csv"
              ? "Fichier CSV avec colonnes : date, libellé/description, montant. Export depuis votre banque (Société Générale, BNP, LCL, Crédit Mutuel, etc.)."
              : "Fichier OFX/QFX exporté depuis votre espace bancaire en ligne. Format standard supporté par la plupart des banques françaises."}
          </div>

          {/* File input */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">
              {tab === "csv" ? "Fichier CSV" : "Fichier OFX / QFX"}
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition group">
              <FaUpload className="w-6 h-6 text-gray-300 group-hover:text-emerald-500 mb-2 transition" />
              <span className="text-sm text-gray-500 group-hover:text-emerald-700 transition">
                Cliquez pour choisir un fichier
              </span>
              <span className="text-xs text-gray-400 mt-1">
                {tab === "csv" ? ".csv" : ".ofx, .qfx"}
              </span>
              <input
                type="file"
                accept={tab === "csv" ? ".csv" : ".ofx,.qfx"}
                onChange={tab === "csv" ? handleCSVFile : handleOFXFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Mapping colonnes CSV */}
          {tab === "csv" && csvHeaders.length > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Correspondance des colonnes</p>
              {[
                { label: "Colonne Date", value: colDate, setter: setColDate },
                { label: "Colonne Description", value: colDesc, setter: setColDesc },
                { label: "Colonne Montant", value: colMontant, setter: setColMontant },
              ].map(({ label, value, setter }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-36 flex-shrink-0">{label}</span>
                  <select value={value} onChange={(e) => setter(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">-- choisir --</option>
                    {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          {tab === "csv" && csvPreview.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-600">
                {csvPreview.length} transaction{csvPreview.length > 1 ? "s" : ""} détectée{csvPreview.length > 1 ? "s" : ""}
              </div>
              <PreviewTable rows={csvPreview} />
            </>
          )}
          {tab === "ofx" && ofxRows.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-600">
                {ofxRows.length} transaction{ofxRows.length > 1 ? "s" : ""} détectée{ofxRows.length > 1 ? "s" : ""}
              </div>
              <PreviewTable rows={ofxRows} />
            </>
          )}

          {/* Catégorie */}
          {((tab === "csv" && csvPreview.length > 0) || (tab === "ofx" && ofxRows.length > 0)) && (
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Catégorie (optionnel)</label>
              <select value={categorieId} onChange={(e) => setCategorieId(e.target.value)} className={inputClass}>
                <option value="">-- Sans catégorie --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {result !== null && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
              <FaCheckCircle className="w-4 h-4 flex-shrink-0" />
              {result} dépense{result > 1 ? "s" : ""} importée{result > 1 ? "s" : ""} avec succès.
              <button onClick={() => navigate("/dashboard/depenses")} className="ml-auto underline text-emerald-700 text-xs">
                Voir les dépenses
              </button>
            </div>
          )}

          {/* Bouton import */}
          <button
            onClick={handleImport}
            disabled={importing || (tab === "csv" ? csvPreview.length === 0 : ofxRows.length === 0)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {importing ? "Import en cours..." : `Importer les transactions`}
          </button>

        </div>
      </div>
    </main>
  );
}
