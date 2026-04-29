import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { useAuth } from "../context/AuthContext";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default function BilanComptable() {
  const { entrepriseId } = useAuth();
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!entrepriseId) return;
    const fetchData = async () => {
      setLoading(true);
      const [facturesSnap, depensesSnap] = await Promise.all([
        getDocs(collection(db, "entreprises", entrepriseId, "factures")),
        getDocs(collection(db, "entreprises", entrepriseId, "depenses")),
      ]);
      const all = [
        ...facturesSnap.docs.map((d) => ({ ...d.data(), id: d.id, type: "revenu", libelle: d.data().description, montant: d.data().totalTTC || 0, compte: d.data().compteComptable || "706" })),
        ...depensesSnap.docs.map((d) => ({ ...d.data(), id: d.id, type: "depense", libelle: d.data().description, montant: d.data().montantTTC || 0, compte: d.data().compteComptable || "60" })),
      ].filter((l) => { const date = l.date?.toDate?.(); return date && date.getMonth() + 1 === mois && date.getFullYear() === annee; });
      setLignes(all);
      setLoading(false);
    };
    fetchData();
  }, [entrepriseId, mois, annee]);

  const totalRevenus = lignes.filter((l) => l.type === "revenu").reduce((s, l) => s + l.montant, 0);
  const totalDepenses = lignes.filter((l) => l.type === "depense").reduce((s, l) => s + l.montant, 0);
  const net = totalRevenus - totalDepenses;

  const exportCSV = () => {
    const rows = lignes.map((l) => `${l.date?.toDate?.().toLocaleDateString() || ""},${l.type},${l.libelle},${l.montant},${l.compte}`);
    rows.push(`\nTOTAL REVENUS,,${totalRevenus}`, `TOTAL DEPENSES,,${totalDepenses}`, `SOLDE NET,,${net}`);
    saveAs(new Blob(["Date,Type,Libellé,Montant,Compte\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" }), `bilan_${mois}_${annee}.csv`);
  };

  const exportPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(12);
    pdf.text(`Bilan Comptable - ${mois}/${annee}`, 15, 15);
    let y = 25;
    ["Date", "Type", "Libellé", "Montant", "Compte"].forEach((h, i) => pdf.text(h, [15, 45, 75, 135, 165][i], y));
    y += 7;
    lignes.forEach((l) => {
      pdf.text(l.date?.toDate?.().toLocaleDateString() || "", 15, y);
      pdf.text(l.type, 45, y); pdf.text(l.libelle || "", 75, y);
      pdf.text(String(l.montant), 135, y); pdf.text(l.compte, 165, y);
      y += 7; if (y > 280) { pdf.addPage(); y = 25; }
    });
    pdf.text(`Revenus : ${totalRevenus.toFixed(2)} €`, 15, y + 10);
    pdf.text(`Dépenses : ${totalDepenses.toFixed(2)} €`, 15, y + 17);
    pdf.text(`Solde net : ${net.toFixed(2)} €`, 15, y + 24);
    pdf.save(`bilan-${mois}-${annee}.pdf`);
  };

  const selectClass = "border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0d1b3e]">Bilan comptable</h2>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm px-4 py-2.5 rounded-xl transition">CSV</button>
          <button onClick={exportPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition">PDF</button>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <select value={mois} onChange={(e) => setMois(parseInt(e.target.value))} className={selectClass}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString("fr-FR", { month: "long" })}</option>
          ))}
        </select>
        <select value={annee} onChange={(e) => setAnnee(parseInt(e.target.value))} className={selectClass}>
          {[2023, 2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Revenus", val: totalRevenus, color: "text-emerald-600" },
          { label: "Dépenses", val: totalDepenses, color: "text-red-500" },
          { label: "Solde net", val: net, color: net >= 0 ? "text-emerald-600" : "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-gray-400 mb-1">{s.label}</div>
            <div className={`text-lg font-extrabold ${s.color}`}>{euro.format(s.val)}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Chargement...</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Date", "Type", "Libellé", "Montant TTC", "Compte"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lignes.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">Aucune écriture sur cette période</td></tr>
              ) : lignes.map((l, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-gray-500">{l.date?.toDate?.().toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${l.type === "revenu" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {l.type === "revenu" ? "Revenu" : "Dépense"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#0d1b3e] font-medium">{l.libelle}</td>
                  <td className="px-5 py-4 font-semibold text-[#0d1b3e]">{euro.format(l.montant)}</td>
                  <td className="px-5 py-4 text-gray-400">{l.compte}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
