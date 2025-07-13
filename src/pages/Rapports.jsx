import { useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function Rapports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const exportAllPDFs = async () => {
    setLoading(true);
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // 🔐 Récupérer l'ID d'entreprise de l'utilisateur connecté
    const userSnap = await getDocs(query(collection(db, "utilisateurs"), where("uid", "==", uid)));
    const userData = userSnap.docs[0]?.data();
    const entrepriseId = userData?.entrepriseId;
    if (!entrepriseId) return alert("Aucune entreprise liée à cet utilisateur");

    const zip = new JSZip();

    const pdf1 = await generateDeclarationFiscalePDF(entrepriseId);
    const pdf2 = await generateBilanComptablePDF(entrepriseId);
    const pdf3 = await generateJournalComptablePDF(entrepriseId);

    zip.file(`DeclarationFiscale-${year}.pdf`, pdf1);
    zip.file(`BilanComptable-${year}.pdf`, pdf2);
    zip.file(`JournalComptable-${year}.pdf`, pdf3);

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `rapports-comptables-${year}.zip`);
    setLoading(false);
  };

  return (
    <main className="p-6 max-w-2xl mx-auto bg-white shadow rounded">
      <h2 className="text-2xl font-bold text-[#1B5E20] mb-4">📄 Rapports Comptables (PDF + ZIP)</h2>

      <label className="block mb-4 font-semibold">
        Année :
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="ml-2 border p-2 rounded"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <option key={i} value={2022 + i}>
              {2022 + i}
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={exportAllPDFs}
        disabled={loading}
        className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
      >
        {loading ? "📦 Génération en cours..." : "📥 Télécharger tous les PDF (ZIP)"}
      </button>
    </main>
  );
}

// 🔧 Génération des PDF
async function generateDeclarationFiscalePDF(entrepriseId) {
  const q1 = query(collection(db, "factures"), where("entrepriseId", "==", entrepriseId));
  const q2 = query(collection(db, "depenses"), where("entrepriseId", "==", entrepriseId));
  const [facturesSnap, depensesSnap] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const factures = facturesSnap.docs.map(doc => doc.data());
  const depenses = depensesSnap.docs.map(doc => doc.data());

  const revenus = factures.reduce((sum, f) => f.status !== 'impayée' ? sum + (f.totalTTC || 0) : sum, 0);
  const tvaCol = factures.reduce((sum, f) => sum + (f.tva || 0), 0);

  const totalDep = depenses.reduce((sum, d) => sum + (d.montantTTC || 0), 0);
  const tvaDeduct = depenses.reduce((sum, d) => sum + (d.tva || 0), 0);

  const doc = new jsPDF();
  doc.text(`Déclaration Fiscale - ${new Date().getFullYear()}`, 14, 20);
  autoTable(doc, {
    startY: 30,
    body: [
      ['Revenus', `${revenus.toFixed(2)} €`],
      ['Dépenses', `${totalDep.toFixed(2)} €`],
      ['TVA collectée', `${tvaCol.toFixed(2)} €`],
      ['TVA déductible', `${tvaDeduct.toFixed(2)} €`],
      ['Résultat net', `${(revenus - totalDep).toFixed(2)} €`],
    ],
  });
  return doc.output("blob");
}

async function generateBilanComptablePDF(entrepriseId) {
  const q1 = query(collection(db, "factures"), where("entrepriseId", "==", entrepriseId));
  const q2 = query(collection(db, "depenses"), where("entrepriseId", "==", entrepriseId));
  const [facturesSnap, depensesSnap] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const lignes = [];

  facturesSnap.forEach((doc) => {
    const d = doc.data();
    lignes.push([
      d.date?.toDate?.().toLocaleDateString() || '',
      'revenu',
      d.description || '',
      `${d.totalTTC || 0} €`,
      d.compteComptable || "706",
    ]);
  });

  depensesSnap.forEach((doc) => {
    const d = doc.data();
    lignes.push([
      d.date?.toDate?.().toLocaleDateString() || '',
      'dépense',
      d.description || '',
      `${d.montantTTC || 0} €`,
      d.compteComptable || "60",
    ]);
  });

  const doc = new jsPDF();
  doc.text(`Bilan Comptable - ${new Date().getFullYear()}`, 14, 20);
  autoTable(doc, {
    startY: 30,
    head: [['Date', 'Type', 'Libellé', 'Montant', 'Compte']],
    body: lignes,
  });

  return doc.output("blob");
}

async function generateJournalComptablePDF(entrepriseId) {
  const comptesSnap = await getDocs(query(collection(db, "comptes"), where("entrepriseId", "==", entrepriseId)));
  const factSnap = await getDocs(query(collection(db, "factures"), where("entrepriseId", "==", entrepriseId)));
  const depSnap = await getDocs(query(collection(db, "depenses"), where("entrepriseId", "==", entrepriseId)));

  const comptes = comptesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const lignes = [];

  depSnap.forEach((doc) => {
    const d = doc.data();
    const date = d.date?.toDate?.().toLocaleDateString() || '';
    const montant = d.montantTTC || 0;
    const compteAssocie = comptes.find(c => c.elements?.includes(doc.id));
    const compteNom = compteAssocie?.nom || "606 - Achats";

    lignes.push([date, compteNom, d.description || d.fournisseur, `${montant} €`, '']);
    lignes.push([date, "401 - Fournisseurs", d.description || d.fournisseur, '', `${montant} €`]);
  });

  factSnap.forEach((doc) => {
    const d = doc.data();
    const date = d.date?.toDate?.().toLocaleDateString() || '';
    const montant = d.totalTTC || 0;
    const compteAssocie = comptes.find(c => c.elements?.includes(doc.id));
    const compteNom = compteAssocie?.nom || "706 - Ventes";

    lignes.push([date, "411 - Clients", d.description, `${montant} €`, '']);
    lignes.push([date, compteNom, d.description, '', `${montant} €`]);
  });

  const doc = new jsPDF();
  doc.text(`Journal Comptable - ${new Date().getFullYear()}`, 14, 20);
  autoTable(doc, {
    startY: 30,
    head: [['Date', 'Compte', 'Libellé', 'Débit', 'Crédit']],
    body: lignes,
  });

  return doc.output("blob");
}