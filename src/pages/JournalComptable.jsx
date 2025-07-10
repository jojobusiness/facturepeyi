import { useEffect, useState } from "react";
import { collection, getDocs, query, where, getDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import jsPDF from "jspdf";

export default function JournalComptable() {
  const [journal, setJournal] = useState([]);
  const [mois, setMois] = useState(new Date().getMonth() + 1); // 1-12
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [entrepriseId, setEntrepriseId] = useState(null);

  // 🔍 Récupération entrepriseId depuis l'utilisateur
  useEffect(() => {
    const fetchEntreprise = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userDoc = await getDoc(doc(db, "utilisateurs", user.uid));
      if (userDoc.exists()) {
        setEntrepriseId(userDoc.data().entrepriseId);
      }
    };
    fetchEntreprise();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!entrepriseId) return;

      const comptesSnap = await getDocs(
        collection(db, "entreprises", entrepriseId, "comptes")
      );
      const comptes = comptesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const factSnap = await getDocs(
        collection(db, "entreprises", entrepriseId, "factures")
      );
      const depSnap = await getDocs(
        collection(db, "entreprises", entrepriseId, "depenses")
      );

      const lignes = [];
      let debit = 0;
      let credit = 0;

      // 💸 Traitement des dépenses
      depSnap.forEach((doc) => {
        const data = doc.data();
        const date = data.date?.toDate();
        if (date && date.getMonth() + 1 === mois && date.getFullYear() === annee) {
          const montant = data.montantTTC || 0;
          const compteAssocie = comptes.find((c) => c.elements?.includes(doc.id));
          const compteNom = compteAssocie ? compteAssocie.nom : "606 - Achats";

          lignes.push({
            date: date.toLocaleDateString(),
            compte: compteNom,
            libelle: data.description || data.fournisseur,
            debit: montant,
            credit: "",
          });

          lignes.push({
            date: date.toLocaleDateString(),
            compte: "401 - Fournisseurs",
            libelle: data.description || data.fournisseur,
            debit: "",
            credit: montant,
          });

          debit += montant;
          credit += montant;
        }
      });

      // 🧾 Traitement des factures
      factSnap.forEach((doc) => {
        const data = doc.data();
        const date = data.date?.toDate();
        if (date && date.getMonth() + 1 === mois && date.getFullYear() === annee) {
          const montant = data.totalTTC || 0;
          const compteAssocie = comptes.find((c) => c.elements?.includes(doc.id));
          const compteNom = compteAssocie ? compteAssocie.nom : "706 - Ventes";

          lignes.push({
            date: date.toLocaleDateString(),
            compte: "411 - Clients",
            libelle: data.description,
            debit: montant,
            credit: "",
          });

          lignes.push({
            date: date.toLocaleDateString(),
            compte: compteNom,
            libelle: data.description,
            debit: "",
            credit: montant,
          });

          debit += montant;
          credit += montant;
        }
      });

      setJournal(lignes);
      setTotalDebit(debit);
      setTotalCredit(credit);
    };

    fetchData();
  }, [mois, annee, entrepriseId]);

  const generatePDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(12);
    pdf.text(`Journal Comptable - ${mois}/${annee}`, 15, 15);

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
      pdf.text(String(ligne.debit || ""), 135, y);
      pdf.text(String(ligne.credit || ""), 165, y);
      y += 7;
      if (y > 280) {
        pdf.addPage();
        y = 25;
      }
    });

    pdf.text(`Total Débit : ${totalDebit.toFixed(2)} €`, 15, y + 10);
    pdf.text(`Total Crédit : ${totalCredit.toFixed(2)} €`, 90, y + 10);
    pdf.save(`journal-${mois}-${annee}.pdf`);
  };

  return (
    <main className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📘 Journal Comptable</h2>

      <div className="flex items-center gap-4 mb-4">
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

        <button onClick={generatePDF} className="bg-green-700 text-white px-4 py-2 rounded">
          📄 Télécharger PDF
        </button>
      </div>

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
              <td className="p-2">{ligne.debit ? `${ligne.debit.toFixed(2)} €` : ""}</td>
              <td className="p-2">{ligne.credit ? `${ligne.credit.toFixed(2)} €` : ""}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold border-t bg-gray-100">
            <td colSpan="3" className="p-2 text-right">Totaux :</td>
            <td className="p-2">{totalDebit.toFixed(2)} €</td>
            <td className="p-2">{totalCredit.toFixed(2)} €</td>
          </tr>
        </tfoot>
      </table>
    </main>
  );
}