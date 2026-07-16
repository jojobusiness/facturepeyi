import { useRef, useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { parseDateFR, detectCategorie, CATEGORY_RULES } from "../utils/importCompta";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 Mo

const TYPE_LABELS = {
  facture_emise: { label: "Facture émise", classes: "bg-emerald-50 text-emerald-700" },
  depense:       { label: "Dépense",       classes: "bg-amber-50 text-amber-700" },
  devis:         { label: "Devis",         classes: "bg-blue-50 text-blue-700" },
  inconnu:       { label: "Non reconnu",   classes: "bg-gray-100 text-gray-500" },
};

const CONFIANCE_CLASSES = {
  haute:   "bg-emerald-50 text-emerald-600",
  moyenne: "bg-yellow-50 text-yellow-700",
  basse:   "bg-red-50 text-red-600",
};

// Recalcule HT/TVA à partir de l'extraction (le TTC fait foi)
function computeAmounts(ex) {
  const ttc = Number(ex.montant_ttc) || 0;
  const rate = ex.taux_tva != null ? Number(ex.taux_tva) : null;
  let ht = ex.montant_ht != null ? Number(ex.montant_ht) : null;
  if (ht == null) ht = rate && rate > 0 ? parseFloat((ttc / (1 + rate / 100)).toFixed(2)) : ttc;
  return { ttc, ht, rate: rate ?? 0, tva: parseFloat((ttc - ht).toFixed(2)) };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImportDocuments() {
  const { user, entreprise, entrepriseId } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [rows, setRows] = useState([]);       // {id, filename, status, error, extraction, include}
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0 || !user) return;
    setResult(null);
    setAnalyzing(true);

    const newRows = files.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      filename: f.name,
      status: ACCEPTED.includes(f.type)
        ? (f.size <= MAX_FILE_BYTES ? "attente" : "erreur")
        : "erreur",
      error: !ACCEPTED.includes(f.type)
        ? "Format non supporté"
        : f.size > MAX_FILE_BYTES ? "Fichier > 4 Mo" : null,
      extraction: null,
      include: true,
    }));
    setRows((prev) => [...prev, ...newRows]);

    const token = await user.getIdToken();
    let done = 0;
    const toAnalyze = newRows.filter((r) => r.status === "attente");

    for (let i = 0; i < toAnalyze.length; i++) {
      const row = toAnalyze[i];
      const file = files.find((f) => f.name === row.filename && f.size <= MAX_FILE_BYTES);
      setProgress(`Analyse ${done + 1}/${toAnalyze.length} — ${row.filename}`);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "analyse" } : r)));
      try {
        const data = await fileToBase64(file);
        const res = await fetch("/api/extract-document", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ mediaType: file.type, data }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur d'analyse");
        setRows((prev) => prev.map((r) =>
          r.id === row.id ? { ...r, status: "ok", extraction: json.extraction } : r
        ));
      } catch (err) {
        setRows((prev) => prev.map((r) =>
          r.id === row.id ? { ...r, status: "erreur", error: err.message } : r
        ));
        // Quota atteint → inutile de continuer la boucle
        if (String(err.message).includes("Quota")) break;
      }
      done++;
    }
    setProgress(null);
    setAnalyzing(false);
  };

  const importables = rows.filter((r) => {
    if (r.status !== "ok" || !r.include || !r.extraction) return false;
    const ex = r.extraction;
    return ex.type_document !== "inconnu" && Number(ex.montant_ttc) > 0 && !!parseDateFR(ex.date);
  });

  const handleImport = async () => {
    if (!entrepriseId || importables.length === 0) return;
    setImporting(true);
    try {
      // Catégories pour les dépenses (auto-création, même logique qu'ImportDepenses)
      const catSnap = await getDocs(collection(db, "entreprises", entrepriseId, "categories"));
      const catIdByNom = {};
      catSnap.docs.forEach((d) => { catIdByNom[d.data().nom?.toLowerCase()] = d.id; });

      let counts = { facture_emise: 0, depense: 0, devis: 0 };
      for (const row of importables) {
        const ex = row.extraction;
        const { ttc, ht, rate, tva } = computeAmounts(ex);
        const date = parseDateFR(ex.date);

        if (ex.type_document === "facture_emise") {
          // Facture HISTORIQUE : numéro d'origine conservé, pas de compteur séquentiel
          await addDoc(collection(db, "entreprises", entrepriseId, "factures"), {
            clientId: "",
            clientNom: ex.destinataire || "",
            clientEmail: "",
            description: ex.description || "",
            amountHT: ht,
            tva,
            totalTTC: ttc,
            tvaRate: rate,
            mentionLegale: entreprise?.mentionLegale || "",
            date: Timestamp.fromDate(date),
            status: ex.statut || "payée",
            createdAt: Timestamp.now(),
            entrepriseId,
            ...(ex.numero ? { numero: ex.numero } : {}),
            imported: true,
          });
          counts.facture_emise++;
        } else if (ex.type_document === "depense") {
          const catRule = detectCategorie(`${ex.emetteur} ${ex.description}`);
          let categorieId = "";
          if (catRule) {
            categorieId = catIdByNom[catRule.nom.toLowerCase()];
            if (!categorieId) {
              const rule = CATEGORY_RULES.find((c) => c.nom === catRule.nom);
              const ref = await addDoc(collection(db, "entreprises", entrepriseId, "categories"), {
                nom: catRule.nom,
                couleur: rule?.couleur || "#059669",
                createdAt: Timestamp.now(),
              });
              categorieId = ref.id;
              catIdByNom[catRule.nom.toLowerCase()] = ref.id;
            }
          }
          await addDoc(collection(db, "entreprises", entrepriseId, "depenses"), {
            fournisseur: ex.emetteur || "",
            description: ex.description || "",
            montantHT: ht,
            tauxTVA: rate,
            montantTVA: tva,
            montantTTC: ttc,
            categorieId,
            date: Timestamp.fromDate(date),
            createdAt: Timestamp.now(),
            entrepriseId,
            imported: true,
          });
          counts.depense++;
        } else if (ex.type_document === "devis") {
          await addDoc(collection(db, "entreprises", entrepriseId, "devis"), {
            clientId: "",
            clientNom: ex.destinataire || "",
            clientEmail: "",
            description: ex.description || "",
            amountHT: ht,
            tva,
            totalTTC: ttc,
            tvaRate: rate,
            mentionLegale: entreprise?.mentionLegale || "",
            date: Timestamp.fromDate(date),
            dateValidite: Timestamp.fromDate(new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000)),
            status: "envoyé",
            createdAt: Timestamp.now(),
            entrepriseId,
            imported: true,
          });
          counts.devis++;
        }
      }
      setResult(counts);
      setRows([]);
    } catch (err) {
      console.error("Erreur import :", err);
      alert("Erreur lors de l'import.");
    } finally {
      setImporting(false);
    }
  };

  const okCount = rows.filter((r) => r.status === "ok").length;

  return (
    <main className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-1">Import de documents par IA</h2>
      <p className="text-sm text-gray-400 mb-6">
        Déposez vos factures, reçus et devis en PDF ou photo — l'IA les lit, les trie et les importe.
      </p>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          Formats acceptés : <strong>PDF, JPG, PNG, WebP</strong> (4 Mo max par fichier). L'IA détecte
          automatiquement s'il s'agit d'une facture que vous avez émise, d'une dépense ou d'un devis.
          Rien n'est importé sans votre validation.
        </div>

        <div
          onClick={() => !analyzing && inputRef.current?.click()}
          className={`border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center transition ${analyzing ? "opacity-60" : "cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40"}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (!analyzing) handleFiles(e.dataTransfer.files); }}
        >
          <div className="text-4xl mb-2">📄✨</div>
          <p className="font-semibold text-[#0d1b3e]">Glissez vos documents ici</p>
          <p className="text-sm text-gray-400 mt-1">ou cliquez pour les sélectionner (plusieurs à la fois)</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
          />
        </div>

        {progress && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
            <span className="inline-block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            {progress}
          </div>
        )}

        {rows.length > 0 && (
          <div className="border border-gray-100 rounded-xl overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 sticky top-0">
                  {["", "Fichier", "Type", "Tiers", "Total TTC", "Date", "N°", "Confiance"].map((h, i) => (
                    <th key={i} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r) => {
                  const ex = r.extraction;
                  const typeCfg = ex ? TYPE_LABELS[ex.type_document] : null;
                  const tiers = ex ? (ex.type_document === "depense" ? ex.emetteur : ex.destinataire) : "";
                  return (
                    <tr key={r.id} className={r.status === "erreur" || (ex && ex.type_document === "inconnu") ? "opacity-50" : ""}>
                      <td className="px-3 py-2.5">
                        {r.status === "ok" && ex?.type_document !== "inconnu" && (
                          <input
                            type="checkbox"
                            checked={r.include}
                            onChange={() => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, include: !x.include } : x))}
                            className="accent-emerald-600"
                          />
                        )}
                        {r.status === "analyse" && <span className="inline-block w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />}
                      </td>
                      <td className="px-3 py-2.5 max-w-[160px] truncate font-medium" title={r.filename}>{r.filename}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {r.status === "erreur"
                          ? <span className="text-xs text-red-500">{r.error}</span>
                          : typeCfg
                            ? <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${typeCfg.classes}`}>{typeCfg.label}</span>
                            : <span className="text-xs text-gray-300">…</span>}
                      </td>
                      <td className="px-3 py-2.5 max-w-[160px] truncate">{tiers || "—"}</td>
                      <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{ex ? `${Number(ex.montant_ttc || 0).toFixed(2)} €` : "—"}</td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{ex?.date || "—"}</td>
                      <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{ex?.numero || "—"}</td>
                      <td className="px-3 py-2.5">
                        {ex && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${CONFIANCE_CLASSES[ex.confiance] || ""}`}>
                            {ex.confiance}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {okCount > 0 && (
          <p className="text-xs text-gray-400">
            Vérifiez les lignes en confiance <span className="text-red-500 font-semibold">basse</span> avant
            d'importer — décochez celles à exclure. Les documents non reconnus ne sont jamais importés.
          </p>
        )}

        {result && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
            Import terminé : {result.facture_emise} facture{result.facture_emise !== 1 ? "s" : ""},{" "}
            {result.depense} dépense{result.depense !== 1 ? "s" : ""}, {result.devis} devis.
            {" "}Consultez vos <button onClick={() => navigate("/dashboard/factures")} className="underline font-semibold">factures</button>,{" "}
            <button onClick={() => navigate("/dashboard/depenses")} className="underline font-semibold">dépenses</button> et{" "}
            <button onClick={() => navigate("/dashboard/devis")} className="underline font-semibold">devis</button>.
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={importables.length === 0 || importing || analyzing}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
        >
          {importing
            ? "Import en cours..."
            : `Importer ${importables.length > 0 ? `${importables.length} document${importables.length !== 1 ? "s" : ""}` : ""}`}
        </button>
      </div>
    </main>
  );
}
