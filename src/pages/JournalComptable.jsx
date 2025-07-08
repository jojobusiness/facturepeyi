import { useEffect, useState } from "react";
import { collection, getDocs, doc, query, where } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import jsPDF from "jspdf";

export default function JournalComptable() {
  const [journal, setJournal] = useState([]);
  const [totaux, setTotaux] = useState({ debit: 0, credit: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const comptesSnap = await getDocs(
        query(collection(db, "comptes"), where("uid", "==", uid))
      );
      const comptes = comptesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const facturesSnap = await getDocs(
        query(collection(db, "factures"), where("uid", "==", uid))
      );
      const depensesSnap = await getDocs(
        query(collection(db, "depenses"), where("uid", "==", uid))
      );

      const factures = facturesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "facture",
      }));
      const depenses = depensesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "depense",
      }));

      const lignes = [];
      let totalDebit = 0;
      let totalCredit = 0;

      for (const compte of comptes) {
        for (const eid of compte.elements || []) {
          let elt =
            compte.type === "revenu"
              ? factures.find((f) => f.id === eid)
              : depenses.find((d) => d.id === eid);
          if (!elt) continue;

          const date = elt.date?.toDate().toLocaleDateString() || "";
          const montant = elt.montantTTC || elt.totalTTC || 0;
          const libelle = elt.description || elt.fournisseur || elt.clientNom || "—";

          if (compte.type === "depense") {
            lignes.push({ date, compte: compte.nom, libelle, debit: montant, credit: "" });
            lignes.push({ date, compte: "401 - Fournisseurs", libelle, debit: "", credit: montant });
            totalDebit += montant;
            totalCredit += montant;
          } else {
            lignes.push({ date, compte: "411 - Clients", libelle, debit: montant, credit: "" });
            lignes.push({ date, compte: compte.nom, libelle, debit: "", credit: montant });
            totalDebit += montant;
            totalCredit += montant;
          }
        }
      }

      setJournal(lignes);
      setTotaux({ debit: totalDebit, credit: totalCredit });
    };

    fetchData();
  }, []);

  const generatePDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(12);
    pdf.text("Journal Comptable", 15, 15);

    let y = 25;
    pdf.text("Date", 15, y);
    pdf.text("Compte", 45, y);
    pdf.text("Libellé", 85, y);
    pdf.text("Débit", 135, y);
    pdf.text("Crédit", 165, y);
    y += 7;

    journal.forEach((ligne) => {
      pdf.text(ligne.date || "", 15, y);
      pdf.text(ligne.compte, 45, y);
      pdf.text(ligne.libelle, 85, y);
      pdf.text(String(ligne.debit), 135, y);
      pdf.text(String(ligne.credit), 165, y);
      y += 7;
      if (y > 280) {
        pdf.addPage();
        y = 25;
      }
    });

    // Totaux
    pdf.setFont("helvetica", "bold");
    pdf.text("TOTAL", 85, y);
    pdf.text(String(totaux.debit.toFixed(2)), 135, y);
    pdf.text(String(totaux.credit.toFixed(2)), 165, y);

    pdf.save("journal-comptable.pdf");
  };

  return (
    <main className="p-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📘 Journal Comptable</h2>
      <button
        onClick={generatePDF}
        className="mb-4 px-4 py-2 bg-green-700 text-white rounded"
      >
        📄 Télécharger en PDF
      </button>
      <table className="w-full bg-white shadow rounded text-sm">
        <thead className="bg-[#1B5E20] text-white">
          <tr>
            <th className="p-2">Date</th>
            <th className="p-2">Compte</th>
            <th className="p-2">Libellé</th>
            <th className="p-2">Débit</th>
            <th className="p-2">Crédit</th>
          </tr>
        </thead>
        <tbody>
          {journal.map((ligne, index) => (
            <tr key={index} className="border-t">
              <td className="p-2">{ligne.date}</td>
              <td className="p-2">{ligne.compte}</td>
              <td className="p-2">{ligne.libelle}</td>
              <td className="p-2">{ligne.debit}</td>
              <td className="p-2">{ligne.credit}</td>
            </tr>
          ))}
          <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
            <td className="p-2" colSpan={3}>
              TOTAL
            </td>
            <td className="p-2">{totaux.debit.toFixed(2)}</td>
            <td className="p-2">{totaux.credit.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}