import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

export default function BilanComptable() {
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);

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

      const factures = facturesSnap.docs.map((doc) => ({
        id: doc.id,
        type: "revenu",
        libelle: doc.data().description,
        montant: doc.data().amountHT || doc.data().amount,
        compte: doc.data().compteComptable || "706",
        date: doc.data().date?.toDate(),
      }));

      const depenses = depensesSnap.docs.map((doc) => ({
        id: doc.id,
        type: "depense",
        libelle: doc.data().description,
        montant: doc.data().montantHT,
        compte: doc.data().compteComptable || "60",
        date: doc.data().date?.toDate(),
      }));

      setLignes([...factures, ...depenses]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const exportCSV = () => {
    const csvHeader = "Date,Type,Libellé,Montant,Compte\n";
    const csvRows = lignes.map((ligne) => {
      const date = ligne.date?.toLocaleDateString() || "";
      return `${date},${ligne.type},${ligne.libelle},${ligne.montant},${ligne.compte}`;
    });
    const blob = new Blob([csvHeader + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    saveAs(blob, "bilan_comptable.csv");
  };

  const exportPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(12);
    pdf.text("Bilan Comptable", 15, 15);

    let y = 25;
    pdf.text("Date", 15, y);
    pdf.text("Type", 45, y);
    pdf.text("Libellé", 75, y);
    pdf.text("Montant", 135, y);
    pdf.text("Compte", 165, y);
    y += 7;

    lignes.forEach((ligne) => {
      pdf.text(ligne.date?.toLocaleDateString() || "", 15, y);
      pdf.text(ligne.type, 45, y);
      pdf.text(ligne.libelle, 75, y);
      pdf.text(String(ligne.montant), 135, y);
      pdf.text(ligne.compte, 165, y);
      y += 7;
      if (y > 280) {
        pdf.addPage();
        y = 25;
      }
    });

    pdf.save("bilan_comptable.pdf");
  };

  if (loading) return <p className="p-4">Chargement du bilan...</p>;

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-4">📊 Bilan Comptable</h2>

      <table className="w-full bg-white shadow rounded text-sm">
        <thead className="bg-[#1B5E20] text-white">
          <tr>
            <th className="text-left p-2">Date</th>
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Libellé</th>
            <th className="text-left p-2">Montant HT</th>
            <th className="text-left p-2">Compte</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-2">{ligne.date?.toLocaleDateString()}</td>
              <td className="p-2 capitalize">{ligne.type}</td>
              <td className="p-2">{ligne.libelle}</td>
              <td className="p-2">{ligne.montant} €</td>
              <td className="p-2">{ligne.compte}</td>
            </tr>
          ))}
        </tbody>
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