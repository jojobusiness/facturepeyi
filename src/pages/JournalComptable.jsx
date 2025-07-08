import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import jsPDF from "jspdf";
import { onAuthStateChanged } from "firebase/auth";

export default function JournalComptable() {
  const [journal, setJournal] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [uid, setUid] = useState(null);

  // Obtenir uid utilisateur connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
    });
    return () => unsubscribe();
  }, []);

  // Charger comptes + lignes du journal
  useEffect(() => {
    if (!uid) return;

    const fetchData = async () => {
      try {
        const comptesSnap = await getDocs(
          query(collection(db, "comptes"), where("uid", "==", uid))
        );
        const comptesData = comptesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComptes(comptesData);

        const factSnap = await getDocs(
          query(collection(db, "factures"), where("uid", "==", uid))
        );
        const depSnap = await getDocs(
          query(collection(db, "depenses"), where("uid", "==", uid))
        );

        const factures = factSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "facture" }));
        const depenses = depSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "depense" }));

        const lignes = [];

        // Ligne double écriture dépenses
        depenses.forEach(dep => {
          const compteId = dep.compteComptable || "606";
          const compteNom = comptesData.find(c => c.id === compteId)?.nom || "606 - Achats";
          const date = dep.date?.toDate().toLocaleDateString();

          lignes.push({
            date,
            compte: compteNom,
            libelle: dep.description,
            debit: dep.montantTTC,
            credit: ""
          });

          lignes.push({
            date,
            compte: "401 - Fournisseurs",
            libelle: dep.description,
            debit: "",
            credit: dep.montantTTC
          });
        });

        // Ligne double écriture factures
        factures.forEach(fac => {
          const compteId = fac.compteComptable || "706";
          const compteNom = comptesData.find(c => c.id === compteId)?.nom || "706 - Ventes";
          const date = fac.date?.toDate().toLocaleDateString();

          lignes.push({
            date,
            compte: "411 - Clients",
            libelle: fac.description,
            debit: fac.totalTTC,
            credit: ""
          });

          lignes.push({
            date,
            compte: compteNom,
            libelle: fac.description,
            debit: "",
            credit: fac.totalTTC
          });
        });

        setJournal(lignes);
      } catch (err) {
        console.error("Erreur chargement journal :", err);
      }
    };

    fetchData();
  }, [uid]);

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
      pdf.text(String(ligne.debit || ""), 135, y);
      pdf.text(String(ligne.credit || ""), 165, y);
      y += 7;
      if (y > 280) {
        pdf.addPage();
        y = 25;
      }
    });

    pdf.save("journal-comptable.pdf");
  };

  if (!uid) return <p className="p-4">Chargement utilisateur...</p>;

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
              <td className="p-2">{ligne.debit || ""}</td>
              <td className="p-2">{ligne.credit || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}