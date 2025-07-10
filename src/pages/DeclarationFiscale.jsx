import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function DeclarationFiscale() {
  const [periode, setPeriode] = useState('2025');
  const [revenus, setRevenus] = useState(0);
  const [depenses, setDepenses] = useState(0);
  const [tvaCollectee, setTvaCollectee] = useState(0);
  const [tvaDeductible, setTvaDeductible] = useState(0);
  const [net, setNet] = useState(0);
  const [entrepriseId, setEntrepriseId] = useState(null);

  // 🔍 Récupère entrepriseId lié à l'utilisateur
  useEffect(() => {
    const fetchEntrepriseId = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'utilisateurs', user.uid));
      if (userDoc.exists()) {
        setEntrepriseId(userDoc.data().entrepriseId);
      }
    };

    fetchEntrepriseId();
  }, []);

  // 📦 Récupère factures + dépenses de l’entreprise
  useEffect(() => {
    const fetchData = async () => {
      if (!entrepriseId) return;

      const facturesSnap = await getDocs(
        collection(db, 'entreprises', entrepriseId, 'factures')
      );
      const depensesSnap = await getDocs(
        collection(db, 'entreprises', entrepriseId, 'depenses')
      );

      const factures = facturesSnap.docs.map((doc) => doc.data());
      const depenses = depensesSnap.docs.map((doc) => doc.data());

      const facturesFiltres = filterByPeriode(factures, periode);
      const depensesFiltres = filterByPeriode(depenses, periode);

      const revenusTotal = facturesFiltres.reduce(
        (sum, f) => (f.status !== 'impayée' ? sum + parseFloat(f.totalTTC || 0) : sum),
        0
      );

      const tvaCol = facturesFiltres.reduce(
        (sum, f) => sum + parseFloat(f.tva || 0),
        0
      );

      const depensesTotal = depensesFiltres.reduce(
        (sum, d) => sum + parseFloat(d.montantTTC || 0),
        0
      );

      const tvaDeduct = depensesFiltres.reduce(
        (sum, d) => sum + parseFloat(d.montantTVA || 0),
        0
      );

      setRevenus(revenusTotal);
      setDepenses(depensesTotal);
      setTvaCollectee(tvaCol);
      setTvaDeductible(tvaDeduct);
      setNet(revenusTotal - depensesTotal);
    };

    fetchData();
  }, [periode, entrepriseId]);

  const filterByPeriode = (data, periode) => {
    return data.filter((item) => {
      const d = item.date?.toDate?.() || new Date(item.date);
      if (periode === '2025-T1') return d >= new Date('2025-01-01') && d <= new Date('2025-03-31');
      if (periode === '2025-T2') return d >= new Date('2025-04-01') && d <= new Date('2025-06-30');
      if (periode === '2025') return d.getFullYear() === 2025;
      return true;
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Déclaration fiscale - ${periode}`, 14, 20);
    autoTable(doc, {
      startY: 30,
      body: [
        ['Revenus', `${revenus.toFixed(2)} €`],
        ['Dépenses', `${depenses.toFixed(2)} €`],
        ['TVA collectée', `${tvaCollectee.toFixed(2)} €`],
        ['TVA déductible', `${tvaDeductible.toFixed(2)} €`],
        ['Résultat net', `${net.toFixed(2)} €`],
      ],
    });
    doc.save(`declaration-fiscale-${periode}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        Periode: periode,
        Revenus: revenus,
        Dépenses: depenses,
        TVA_Collectée: tvaCollectee,
        TVA_Déductible: tvaDeductible,
        Résultat_Net: net,
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Déclaration');
    XLSX.writeFile(wb, `declaration-fiscale-${periode}.xlsx`);
  };

  return (
    <div className="p-6 bg-white rounded shadow max-w-2xl mx-auto mt-10">
      <h2 className="text-xl font-bold text-[#1B5E20] mb-4">📄 Déclaration fiscale simplifiée</h2>

      <label className="block mb-4">
        Choisir la période :
        <select className="ml-2 border rounded p-1" value={periode} onChange={(e) => setPeriode(e.target.value)}>
          <option value="2025">Année 2025</option>
          <option value="2025-T1">1er trimestre 2025</option>
          <option value="2025-T2">2e trimestre 2025</option>
        </select>
      </label>

      <div className="space-y-2 mb-6">
        <p>💰 Revenus : <strong>{revenus.toFixed(2)} €</strong></p>
        <p>💸 Dépenses : <strong>{depenses.toFixed(2)} €</strong></p>
        <p>📤 TVA collectée : <strong>{tvaCollectee.toFixed(2)} €</strong></p>
        <p>📥 TVA déductible : <strong>{tvaDeductible.toFixed(2)} €</strong></p>
        <p>🧾 Résultat net : <strong>{net.toFixed(2)} €</strong></p>
      </div>

      <div className="flex gap-4">
        <button onClick={exportPDF} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          📥 Exporter en PDF
        </button>
        <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          📥 Exporter en Excel
        </button>
      </div>
    </div>
  );
}