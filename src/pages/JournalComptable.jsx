import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default function JournalComptable() {
  const { entrepriseId } = useAuth();
  const [journal, setJournal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!entrepriseId) return;
    const fetchData = async () => {
      setLoading(true);
      const [comptesSnap, factSnap, depSnap] = await Promise.all([
        getDocs(collection(db, "entreprises", entrepriseId, "comptes")),
        getDocs(collection(db, "entreprises", entrepriseId, "factures")),
        getDocs(collection(db, "entreprises", entrepriseId, "depenses")),
      ]);
      const comptes = comptesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const lignes = [];
      let debit = 0;
      let credit = 0;

      depSnap.forEach((d) => {
        const data = d.data();
        const date = data.date?.toDate();
        if (!date || date.getMonth() + 1 !== mois || date.getFullYear() !== annee) return;
        const montant = data.montantTTC || 0;
        const compteNom = comptes.find((c) => c.elements?.includes(d.id))?.nom || "606 - Achats";
        lignes.push({ date: date.toLocaleDateString("fr-FR"), compte: compteNom, libelle: data.description || data.fournisseur, debit: montant, credit: "" });
        lignes.push({ date: date.toLocaleDateString("fr-FR"), compte: "401 - Fournisseurs", libelle: data.description || data.fournisseur, debit: "", credit: montant });
        debit += montant;
        credit += montant;
      });

      factSnap.forEach((d) => {
        const data = d.data();
        const date = data.date?.toDate();
        if (!date || date.getMonth() + 1 !== mois || date.getFullYear() !== annee) return;
        const montant = data.totalTTC || 0;
        const compteNom = comptes.find((c) => c.elements?.includes(d.id))?.nom || "706 - Ventes";
        lignes.push({ date: date.toLocaleDateString("fr-FR"), compte: "411 - Clients", libelle: data.description, debit: montant, credit: "" });
        lignes.push({ date: date.toLocaleDateString("fr-FR"), compte: compteNom, libelle: data.description, debit: "", credit: montant });
        debit += montant;
        credit += montant;
      });

      setJournal(lignes);
      setTotalDebit(debit);
      setTotalCredit(credit);
      setLoading(false);
    };
    fetchData();
  }, [entrepriseId, mois, annee]);

  const generatePDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(12);
    pdf.text(`Journal Comptable - ${mois}/${annee}`, 15, 15);
    let y = 25;
    ["Date", "Compte", "Libellé", "Débit", "Crédit"].forEach((h, i) => pdf.text(h, [15, 45, 85, 135, 165][i], y));
    y += 7;
    journal.forEach((l) => {
      pdf.text(l.date || "", 15, y);
      pdf.text(l.compte, 45, y);
      pdf.text(l.libelle || "", 85, y);
      pdf.text(l.debit ? l.debit.toFixed(2) : "", 135, y);
      pdf.text(l.credit ? l.credit.toFixed(2) : "", 165, y);
      y += 7;
      if (y > 280) { pdf.addPage(); y = 25; }
    });
    pdf.text(`Total Débit : ${totalDebit.toFixed(2)} €`, 15, y + 10);
    pdf.text(`Total Crédit : ${totalCredit.toFixed(2)} €`, 90, y + 10);
    pdf.save(`journal-${mois}-${annee}.pdf`);
  };

  const selectClass = "border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0d1b3e]">Journal comptable</h2>
        <button onClick={generatePDF} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition">
          PDF
        </button>
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

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Chargement...</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Date", "Compte", "Libellé", "Débit", "Crédit"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {journal.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">Aucune écriture sur cette période</td></tr>
              ) : journal.map((l, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-500">{l.date}</td>
                  <td className="px-5 py-3.5 text-[#0d1b3e] font-medium">{l.compte}</td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{l.libelle}</td>
                  <td className="px-5 py-3.5 font-semibold text-emerald-600">{l.debit ? euro.format(l.debit) : ""}</td>
                  <td className="px-5 py-3.5 font-semibold text-red-500">{l.credit ? euro.format(l.credit) : ""}</td>
                </tr>
              ))}
            </tbody>
            {journal.length > 0 && (
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Totaux</td>
                  <td className="px-5 py-3 font-bold text-emerald-600">{euro.format(totalDebit)}</td>
                  <td className="px-5 py-3 font-bold text-red-500">{euro.format(totalCredit)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </main>
  );
}
