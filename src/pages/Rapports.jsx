import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { getDocs, query, collection, where } from "firebase/firestore";
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
    const userSnap = await getDocs(query(collection(db, "utilisateurs"), where("uid", "==", uid)));
    const entrepriseId = userSnap.docs[0]?.data()?.entrepriseId;
    if (!entrepriseId) { alert("Aucune entreprise liée."); setLoading(false); return; }

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
    <main className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Rapports comptables</h2>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
        <p className="text-sm text-gray-500">
          Exportez en un clic vos rapports comptables : déclaration fiscale, bilan et journal — regroupés dans un ZIP.
        </p>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Année fiscale</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={2022 + i}>{2022 + i}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["Déclaration fiscale", "Bilan comptable", "Journal comptable"].map((r) => (
            <div key={r} className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">📄</div>
              <div className="text-xs font-medium text-gray-600">{r}</div>
            </div>
          ))}
        </div>

        <button
          onClick={exportAllPDFs}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
        >
          {loading ? "Génération en cours..." : "Télécharger tous les PDF (ZIP)"}
        </button>
      </div>
    </main>
  );
}

async function generateDeclarationFiscalePDF(entrepriseId) {
  const q1 = query(collection(db, "factures"), where("entrepriseId", "==", entrepriseId));
  const q2 = query(collection(db, "depenses"), where("entrepriseId", "==", entrepriseId));
  const [facturesSnap, depensesSnap] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const factures = facturesSnap.docs.map(d => d.data());
  const depenses = depensesSnap.docs.map(d => d.data());
  const revenus = factures.reduce((sum, f) => f.status !== "impayée" ? sum + (f.totalTTC || 0) : sum, 0);
  const tvaCol = factures.reduce((sum, f) => sum + (f.tva || 0), 0);
  const totalDep = depenses.reduce((sum, d) => sum + (d.montantTTC || 0), 0);
  const tvaDeduct = depenses.reduce((sum, d) => sum + (d.tva || 0), 0);
  const pdf = new jsPDF();
  pdf.text(`Déclaration Fiscale - ${new Date().getFullYear()}`, 14, 20);
  autoTable(pdf, {
    startY: 30,
    body: [
      ["Revenus", `${revenus.toFixed(2)} €`],
      ["Dépenses", `${totalDep.toFixed(2)} €`],
      ["TVA collectée", `${tvaCol.toFixed(2)} €`],
      ["TVA déductible", `${tvaDeduct.toFixed(2)} €`],
      ["Résultat net", `${(revenus - totalDep).toFixed(2)} €`],
    ],
  });
  return pdf.output("blob");
}

async function generateBilanComptablePDF(entrepriseId) {
  const [facturesSnap, depensesSnap] = await Promise.all([
    getDocs(query(collection(db, "factures"), where("entrepriseId", "==", entrepriseId))),
    getDocs(query(collection(db, "depenses"), where("entrepriseId", "==", entrepriseId))),
  ]);
  const lignes = [];
  facturesSnap.forEach((d) => {
    const v = d.data();
    lignes.push([v.date?.toDate?.().toLocaleDateString() || "", "revenu", v.description || "", `${v.totalTTC || 0} €`, v.compteComptable || "706"]);
  });
  depensesSnap.forEach((d) => {
    const v = d.data();
    lignes.push([v.date?.toDate?.().toLocaleDateString() || "", "dépense", v.description || "", `${v.montantTTC || 0} €`, v.compteComptable || "60"]);
  });
  const pdf = new jsPDF();
  pdf.text(`Bilan Comptable - ${new Date().getFullYear()}`, 14, 20);
  autoTable(pdf, { startY: 30, head: [["Date", "Type", "Libellé", "Montant", "Compte"]], body: lignes });
  return pdf.output("blob");
}

async function generateJournalComptablePDF(entrepriseId) {
  const [comptesSnap, factSnap, depSnap] = await Promise.all([
    getDocs(query(collection(db, "comptes"), where("entrepriseId", "==", entrepriseId))),
    getDocs(query(collection(db, "factures"), where("entrepriseId", "==", entrepriseId))),
    getDocs(query(collection(db, "depenses"), where("entrepriseId", "==", entrepriseId))),
  ]);
  const comptes = comptesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const lignes = [];
  depSnap.forEach((d) => {
    const v = d.data();
    const date = v.date?.toDate?.().toLocaleDateString() || "";
    const montant = v.montantTTC || 0;
    const compteNom = comptes.find(c => c.elements?.includes(d.id))?.nom || "606 - Achats";
    lignes.push([date, compteNom, v.description || v.fournisseur, `${montant} €`, ""]);
    lignes.push([date, "401 - Fournisseurs", v.description || v.fournisseur, "", `${montant} €`]);
  });
  factSnap.forEach((d) => {
    const v = d.data();
    const date = v.date?.toDate?.().toLocaleDateString() || "";
    const montant = v.totalTTC || 0;
    const compteNom = comptes.find(c => c.elements?.includes(d.id))?.nom || "706 - Ventes";
    lignes.push([date, "411 - Clients", v.description, `${montant} €`, ""]);
    lignes.push([date, compteNom, v.description, "", `${montant} €`]);
  });
  const pdf = new jsPDF();
  pdf.text(`Journal Comptable - ${new Date().getFullYear()}`, 14, 20);
  autoTable(pdf, { startY: 30, head: [["Date", "Compte", "Libellé", "Débit", "Crédit"]], body: lignes });
  return pdf.output("blob");
}
