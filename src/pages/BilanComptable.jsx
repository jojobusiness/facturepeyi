import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

export default function BilanComptable() {
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());

  const euro = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const facturesSnap = await getDocs(
        query(collection(db, "factures"), where("uid", "==", uid))
      );
      const depensesSnap = await getDocs(
        query(collection(db, "depenses"), where("uid", "==", uid))
      );

      const factures = facturesSnap.docs.map((doc) => {
        const data = doc.data();
        const date = data.date?.toDate();
        return {
          id: doc.id,
          type: "revenu",
          libelle: data.description,
          montant: data.totalTTC || data.amount || 0,
          compte: data.compteComptable || "706",
          date,
        };
      });

      const depenses = depensesSnap.docs.map((doc) => {
        const data = doc.data();
        const date = data.date?.toDate();
        return {
          id: doc.id,
          type: "depense",
          libelle: data.description,
          montant: data.montantTTC || 0,
          compte: data.compteComptable || "60",
          date,
        };
      });

      const toutes = [...factures, ...depenses].filter((l) => {
        return (
          l.date &&
          l.date.getMonth() + 1 === mois &&
          l.date.getFullYear() === annee
        );
      });

      setLignes(toutes);
      setLoading(false);
    };

    fetchData();
  }, [mois, annee]);

  const totalRevenus = lignes
    .filter((l) => l.type === "revenu")
    .reduce((sum, l) => sum + l.montant, 0);

  const totalDepenses = lignes
    .filter((l) => l.type === "depense")
    .reduce((sum, l) => sum + l.montant, 0);

  const net = totalRevenus - totalDepenses;

  const exportCSV = () => {
    const csvHeader = "Date,Type,Libellé,Montant,Compte\n";
    const csvRows = lignes.map((l) => {
      const date = l.date?.toLocaleDateString() || "";
      return `${date},${l.type},${l.libelle},${l.montant},${l.compte}`;
    });
    csvRows.push(`\nTOTAL REVENUS,,${totalRevenus}`);
    csvRows.push(`TOTAL DEPENSES,,${totalDepenses}`);
    csvRows.push(`SOLDE NET,,${net}`);
    const blob = new Blob([csvHeader + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    saveAs(blob, `bilan_${mois}_${annee}.csv`);
  };

  const exportPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(12);
    pdf.text(`Bilan Comptable - ${mois}/${annee}`, 15, 15);

    let y = 25;
    pdf.text("Date", 15, y);
    pdf.text("Type", 45, y);
    pdf.text("Libellé", 75, y);
    pdf.text("Montant", 135, y);
    pdf.text("Compte", 165, y);
    y += 7;

    lignes.forEach((l) => {
      pdf.text(l.date?.toLocaleDateString() || "", 15, y);
      pdf.text(l.type, 45, y);
      pdf.text(l.libelle, 75, y);
      pdf.text(String(l.montant), 135, y);
      pdf.text(l.compte, 165, y);
      y += 7;
      if (y > 280) {
        pdf.addPage();
        y = 25;
      }
    });

    y += 10;
    pdf.text(`Total Revenus : ${totalRevenus.toFixed(2)} €`, 15, y);
    y += 7;
    pdf.text(`Total Dépenses : ${totalDepenses.toFixed(2)} €`, 15, y);
    y += 7;
    pdf.text(`Solde Net : ${net.toFixed(2)} €`, 15, y);

    pdf.save(`bilan-${mois}-${annee}.pdf`);
  };

  if (loading) return <p className="p-4">Chargement du bilan...</p>;

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-4">📊 Bilan Comptable</h2>

      <div className="flex gap-4 mb-4">
        <select
          value={mois}
          onChange={(e) => setMois(parseInt(e.target.value))}
          className="border p-2 rounded"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("fr-FR", { month: "long" })}
            </option>
          ))}
        </select>

        <select
          value={annee}
          onChange={(e) => setAnnee(parseInt(e.target.value))}
          className="border p-2 rounded"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <option key={i} value={2023 + i}>
              {2023 + i}
            </option>
          ))}
        </select>
      </div>

      <table className="w-full bg-white shadow rounded text-sm">
        <thead className="bg-[#1B5E20] text-white">
          <tr>
            <th className="text-left p-2">Date</th>
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Libellé</th>
            <th className="text-left p-2">Montant TTC</th>
            <th className="text-left p-2">Compte</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-2">{l.date?.toLocaleDateString()}</td>
              <td className="p-2 capitalize">{l.type}</td>
              <td className="p-2">{l.libelle}</td>
              <td className="p-2">{euro.format(l.montant)}</td>
              <td className="p-2">{l.compte}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold border-t bg-gray-100">
            <td colSpan="3" className="p-2 text-right">Total Revenus :</td>
            <td className="p-2">{euro.format(totalRevenus)}</td>
            <td />
          </tr>
          <tr className="font-semibold bg-gray-100">
            <td colSpan="3" className="p-2 text-right">Total Dépenses :</td>
            <td className="p-2">{euro.format(totalDepenses)}</td>
            <td />
          </tr>
          <tr className="font-bold bg-[#E8F5E9]">
            <td colSpan="3" className="p-2 text-right">Solde Net :</td>
            <td className="p-2">{euro.format(net)}</td>
            <td />
          </tr>
        </tfoot>
      </table>

      <div className="mt-4 flex space-x-4">
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ⬇️ Exporter en CSV
        </button>

        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          📄 Exporter en PDF
        </button>
      </div>
    </main>
  );
}