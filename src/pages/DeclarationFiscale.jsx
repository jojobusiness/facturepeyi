import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

const currentYear = new Date().getFullYear();
const PERIODES = [
  { value: `${currentYear}`,    label: `Année ${currentYear}` },
  { value: `${currentYear}-T1`, label: `T1 ${currentYear} (janv.–mars)` },
  { value: `${currentYear}-T2`, label: `T2 ${currentYear} (avr.–juin)` },
  { value: `${currentYear}-T3`, label: `T3 ${currentYear} (juil.–sept.)` },
  { value: `${currentYear}-T4`, label: `T4 ${currentYear} (oct.–déc.)` },
  { value: `${currentYear - 1}`, label: `Année ${currentYear - 1}` },
  { value: `${currentYear - 2}`, label: `Année ${currentYear - 2}` },
];

function filterByPeriode(data, periode) {
  const y = parseInt(periode.substring(0, 4));
  return data.filter((item) => {
    const d = item.date?.toDate?.() || new Date(item.date);
    if (periode.endsWith("-T1")) return d >= new Date(`${y}-01-01`) && d <= new Date(`${y}-03-31`);
    if (periode.endsWith("-T2")) return d >= new Date(`${y}-04-01`) && d <= new Date(`${y}-06-30`);
    if (periode.endsWith("-T3")) return d >= new Date(`${y}-07-01`) && d <= new Date(`${y}-09-30`);
    if (periode.endsWith("-T4")) return d >= new Date(`${y}-10-01`) && d <= new Date(`${y}-12-31`);
    return d.getFullYear() === y;
  });
}

export default function DeclarationFiscale() {
  const { entrepriseId, entreprise } = useAuth();
  const [periode, setPeriode] = useState(`${currentYear}`);
  const [loading, setLoading] = useState(true);
  const [revenus, setRevenus] = useState(0);
  const [depenses, setDepenses] = useState(0);
  const [tvaCollectee, setTvaCollectee] = useState(0);
  const [tvaDeductible, setTvaDeductible] = useState(0);
  const [octroiTotal, setOctroiTotal] = useState(0);
  const [net, setNet] = useState(0);

  const showOctroi = entreprise?.octroiDeMer === true;

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
      const octroi = deps.reduce((s, d) => s + parseFloat(d.montantOctroiDeMer || 0), 0);

      setRevenus(rev);
      setDepenses(dep);
      setTvaCollectee(tvaCol);
      setTvaDeductible(tvaDed);
      setOctroiTotal(octroi);
      setNet(rev - dep);
      setLoading(false);
    };
    fetchData();
  }, [entrepriseId, periode]);

  const periodeLabel = PERIODES.find((p) => p.value === periode)?.label ?? periode;
  const tvaNette = tvaCollectee - tvaDeductible;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Déclaration fiscale — ${periodeLabel}`, 14, 20);
    if (entreprise?.nom) { doc.setFontSize(10); doc.text(entreprise.nom, 14, 28); }
    const rows = [
      ["Revenus (TTC facturé)", euro.format(revenus)],
      ["Dépenses (TTC)", euro.format(depenses)],
      ["TVA collectée", euro.format(tvaCollectee)],
      ["TVA déductible", euro.format(tvaDeductible)],
      ["TVA nette à reverser", euro.format(tvaNette)],
    ];
    if (showOctroi) rows.push(["Octroi de mer payé", euro.format(octroiTotal)]);
    rows.push(["Résultat net", euro.format(net)]);
    autoTable(doc, { startY: 35, body: rows });
    doc.save(`declaration-fiscale-${periode}.pdf`);
  };

  const exportExcel = () => {
    const data = {
      Periode: periodeLabel,
      Revenus: revenus,
      Dépenses: depenses,
      TVA_Collectée: tvaCollectee,
      TVA_Déductible: tvaDeductible,
      TVA_Nette: tvaNette,
      Résultat_Net: net,
    };
    if (showOctroi) data.Octroi_de_Mer = octroiTotal;
    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Déclaration");
    XLSX.writeFile(wb, `declaration-fiscale-${periode}.xlsx`);
  };

  const stats = [
    { label: "Revenus facturés (TTC)", val: revenus, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Dépenses (TTC)", val: depenses, color: "text-red-500", bg: "bg-red-50" },
    { label: "TVA collectée", val: tvaCollectee, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "TVA déductible", val: tvaDeductible, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "TVA nette à reverser", val: tvaNette, color: tvaNette >= 0 ? "text-blue-700" : "text-emerald-600", bg: "bg-blue-50", bold: true },
    ...(showOctroi ? [{ label: "Octroi de mer payé", val: octroiTotal, color: "text-orange-600", bg: "bg-orange-50" }] : []),
    { label: "Résultat net", val: net, color: net >= 0 ? "text-emerald-600" : "text-red-500", bg: net >= 0 ? "bg-emerald-50" : "bg-red-50", bold: true },
  ];

  return (
    <main className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d1b3e]">Déclaration fiscale</h2>
          {entreprise?.territoire && (
            <p className="text-xs text-gray-400 mt-0.5">
              Territoire : {entreprise.territoire} · Régime : {entreprise.regime || "—"}
            </p>
          )}
        </div>
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
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex items-center justify-between px-6 py-4 ${i < stats.length - 1 ? "border-b border-gray-50" : ""} ${s.bold ? "bg-gray-50" : ""}`}
            >
              <span className={`text-sm ${s.bold ? "font-bold text-[#0d1b3e]" : "text-gray-600"}`}>{s.label}</span>
              <span className={`text-sm font-bold ${s.color}`}>{euro.format(s.val)}</span>
            </div>
          ))}
        </div>
      )}

      {showOctroi && !loading && (
        <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xl p-4">
          <p className="text-xs text-orange-700 font-semibold mb-1">Octroi de mer — territoire DOM</p>
          <p className="text-xs text-gray-500 leading-snug">
            Le montant ci-dessus correspond à l'octroi de mer saisi dans vos dépenses sur la période sélectionnée.
            Ce montant est à reporter dans votre déclaration DOM.
          </p>
        </div>
      )}
    </main>
  );
}
