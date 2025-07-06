import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import jsPDF from "jspdf";

export default function JournalComptable() {
  const [journal, setJournal] = useState([]);
  const [planComptable, setPlanComptable] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // Récupère les comptes personnalisés
      const planSnap = await getDoc(doc(db, "plansComptables", uid));
      const comptes = planSnap.exists() ? planSnap.data().comptes || {} : {};
      setPlanComptable(comptes);

      const depSnap = await getDocs(collection(db, "depenses"));
      const factSnap = await getDocs(collection(db, "factures"));

      const depenses = depSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), type: "depense" }));
      const factures = factSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), type: "facture" }));

      const lignes = [];

      depenses.forEach((dep) => {
        const compteDepense = comptes[dep.categorieId] || "606 - Achats";
        lignes.push({ date: dep.date?.toDate().toLocaleDateString(), compte: compteDepense, libelle: dep.description, debit: dep.montantTTC, credit: "" });
        lignes.push({ date: dep.date?.toDate().toLocaleDateString(), compte: "401 - Fournisseurs", libelle: dep.description, debit: "", credit: dep.montantTTC });
      });

      factures.forEach((fac) => {
        const compteFacture = comptes[fac.categorieId] || "706 - Ventes";
        lignes.push({ date: fac.date?.toDate().toLocaleDateString(), compte: "411 - Clients", libelle: fac.description, debit: fac.totalTTC, credit: "" });
        lignes.push({ date: fac.date?.toDate().toLocaleDateString(), compte: compteFacture, libelle: fac.description, debit: "", credit: fac.totalTTC });
      });

      setJournal(lignes);
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
    y += 5;

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

    pdf.save("journal-comptable.pdf");
  };

  return (
    <main className="p-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📘 Journal Comptable</h2>
      <button onClick={generatePDF} className="mb-4 px-4 py-2 bg-green-700 text-white rounded">
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
        </tbody>
      </table>
    </main>
  );
}
