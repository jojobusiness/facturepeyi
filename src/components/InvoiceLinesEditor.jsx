import { FaPlus, FaTrash } from "react-icons/fa";
import { computeTotals, normalizeLines, emptyLine } from "../utils/invoiceLines";

const TVA_OPTIONS = [
  { value: 0, label: "0%" },
  { value: 2.1, label: "2,1%" },
  { value: 5.5, label: "5,5%" },
  { value: 8.5, label: "8,5%" },
  { value: 10, label: "10%" },
  { value: 11, label: "11%" },
  { value: 16, label: "16%" },
  { value: 20, label: "20%" },
];

const fmt = (n) => `${(Number(n) || 0).toFixed(2)} €`;

/**
 * Éditeur de lignes de facture/devis. Contrôlé : `lignes` + `setLignes`.
 * Chaque ligne : { description, quantite, prixUnitaire, tvaRate }.
 */
export default function InvoiceLinesEditor({ lignes, setLignes, defaultRate = 0 }) {
  const update = (i, field, value) => {
    setLignes((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLignes((prev) => [...prev, emptyLine(defaultRate)]);
  const removeLine = (i) => setLignes((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const totals = computeTotals(normalizeLines({ lignes, tvaRate: defaultRate }));

  return (
    <div>
      <div className="space-y-3">
        {lignes.map((l, i) => {
          const ht = (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0);
          return (
            <div key={i} className="border border-gray-200 rounded-xl p-3 bg-gray-50/50">
              <div className="flex items-start gap-2">
                <input
                  type="text"
                  placeholder="Description (ex: main d'œuvre, matériaux…)"
                  value={l.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {lignes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="text-gray-300 hover:text-red-500 p-2 transition flex-shrink-0"
                    title="Supprimer la ligne"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-0.5">Qté</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={l.quantite}
                    onChange={(e) => update(i, "quantite", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-0.5">P.U. HT</label>
                  <input
                    type="number" step="0.01" min="0" placeholder="0,00"
                    value={l.prixUnitaire}
                    onChange={(e) => update(i, "prixUnitaire", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-0.5">TVA</label>
                  <select
                    value={l.tvaRate}
                    onChange={(e) => update(i, "tvaRate", parseFloat(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {TVA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-0.5">Total HT</label>
                  <div className="px-2 py-1.5 text-sm font-semibold text-gray-700">{fmt(ht)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addLine}
        className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition"
      >
        <FaPlus className="w-3 h-3" /> Ajouter une ligne
      </button>

      {/* Récapitulatif */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm mt-4">
        <div className="flex justify-between text-gray-600">
          <span>Sous-total HT</span>
          <span>{fmt(totals.totalHT)}</span>
        </div>
        {Array.from(totals.taxByRate.entries()).map(([rate, amount]) => (
          <div key={rate} className="flex justify-between text-gray-600">
            <span>TVA ({rate}%)</span>
            <span>{fmt(amount)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-[#0d1b3e] border-t border-gray-200 pt-1.5 mt-1.5">
          <span>Total TTC</span>
          <span>{fmt(totals.totalTTC)}</span>
        </div>
      </div>
    </div>
  );
}
