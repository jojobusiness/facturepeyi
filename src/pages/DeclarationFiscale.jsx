import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

const PERIODES = [
  { value: "2025", label: "Année 2025" },
  { value: "2025-T1", label: "T1 2025 (janv.–mars)" },
  { value: "2025-T2", label: "T2 2025 (avr.–juin)" },
  { value: "2025-T3", label: "T3 2025 (juil.–sept.)" },
  { value: "2025-T4", label: "T4 2025 (oct.–déc.)" },
  { value: "2024", label: "Année 2024" },
  { value: "2023", label: "Année 2023" },
];

function filterByPeriode(data, periode) {
  return data.filter((item) => {
    const d = item.date?.toDate?.() || new Date(item.date);
    if (periode === "2025-T1") return d >= new Date("2025-01-01") && d <= new Date("2025-03-31");
    if (periode === "2025-T2") return d >= new Date("2025-04-01") && d <= new Date("2025-06-30");
    if (periode === "2025-T3") return d >= new Date("2025-07-01") && d <= new Date("2025-09-30");
    if (periode === "2025-T4") return d >= new Date("2025-10-01") && d <= new Date("2025-12-31");
    if (periode.length === 4) return d.getFullYear() === parseInt(periode);
    return true;
  });
}

export default function DeclarationFiscale() {
  const { entrepriseId } = useAuth();
  const [periode, setPeriode] = useState("2025");
  const [loading, setLoading] = useState(true);
  const [revenus, setRevenus] = useState(0);
  const [depenses, setDepenses] = useState(0);
  const [tvaCollectee, setTvaCollectee] = useState(0);
  const [tvaDeductible, setTvaDeductible] = useState(0);
  const [net, setNet] = useState(0);

  useEffect(() => {
    if (!entrepriseId) return;
    const fetchData = async () => {
      setLoading(true);
      const [facturesSnap, depensesSnap] = await Promise.all([
        getDocs(collection(db, "entreprises", entrepriseId, "factures")),
        getDocs(collection(db, "entreprises", entrepriseId, "depenses")),
      ]);
      const factures = filterByPeriode(facturesSnap.docs.map((d) => d.data()), periode);
      const deps = filterByPeriode(depensesSnap.docs.map((d) => d.data()), periode);

      const rev = factures.reduce((s, f) => f.status !== "impayée" ? s + parseFloat(f.totalTTC || 0) : s, 0);
      const tvaCol = factures.reduce((s, f) => s + parseFloat(f.tva || 0), 0);
      const dep = deps.reduce((s, d) => s + parseFloat(d.montantTTC || 0), 0);
      const tvaDed = deps.reduce((s, d) => s + parseFloat(d.montantTVA || 0), 0);

      setRevenus(rev);
      setDepenses(dep);
      setTvaCollectee(tvaCol);
      setTvaDeductible(tvaDed);
      setNet(rev - dep);
      setLoading(false);
    };
    fetchData();
  }, [entrepriseId, periode]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Déclaration fiscale — ${PERIODES.find((p) => p.value === periode)?.label}`, 14, 20);
    autoTable(doc, {
      startY: 30,
      body: [
        ["Revenus", euro.format(revenus)],
        ["Dépenses", euro.format(depenses)],
        ["TVA collectée", euro.format(tvaCollectee)],
        ["TVA déductible", euro.format(tvaDeductible)],
        ["Résultat net", euro.format(net)],
      ],
    });
    doc.save(`declaration-fiscale-${periode}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet([{
      Periode: periode,
      Revenus: revenus,
      Dépenses: depenses,
      TVA_Collectée: tvaCollectee,
      TVA_Déductible: tvaDeductible,
      Résultat_Net: net,
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Déclaration");
    XLSX.writeFile(wb, `declaration-fiscale-${periode}.xlsx`);
  };

  const stats = [
    { label: "Revenus", val: revenus, color: "text-emerald-600" },
    { label: "Dépenses", val: depenses, color: "text-red-500" },
    { label: "TVA collectée", val: tvaCollectee, color: "text-blue-600" },
    { label: "TVA déductible", val: tvaDeductible, color: "text-indigo-500" },
    { label: "Résultat net", val: net, color: net >= 0 ? "text-emerald-600" : "text-red-500" },
  ];

  return (
    <main className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0d1b3e]">Déclaration fiscale</h2>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm px-4 py-2.5 rounded-xl transition">Excel</button>
          <button onClick={exportPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition">PDF</button>
        </div>
      </div>

      <div className="mb-5">
        <label className="text-xs font-semibold text-gray-600 block mb-1">Période</label>
        <select
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {PERIODES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Chargement...</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{s.label}</span>
              <span className={`text-sm font-bold ${s.color}`}>{euro.format(s.val)}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
