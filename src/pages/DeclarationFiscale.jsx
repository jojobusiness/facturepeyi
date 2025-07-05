import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function DeclarationFiscale() {
  const [periode, setPeriode] = useState('2025'); // ou "2025-T1", etc.
  const [revenus, setRevenus] = useState(0);
  const [depenses, setDepenses] = useState(0);
  const [tvaCollectee, setTvaCollectee] = useState(0);
  const [tvaDeductible, setTvaDeductible] = useState(0);
  const [net, setNet] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const facturesSnap = await getDocs(query(collection(db, 'factures'), where('uid', '==', uid)));
      const depensesSnap = await getDocs(query(collection(db, 'depenses'), where('uid', '==', uid)));

      const factures = facturesSnap.docs.map(doc => doc.data());
      const depenses = depensesSnap.docs.map(doc => doc.data());

      const facturesFiltres = filterByPeriode(factures, periode);
      const depensesFiltres = filterByPeriode(depenses, periode);

      const revenusTotal = facturesFiltres.reduce((sum, f) =>
        f.status !== 'impayée' ? sum + parseFloat(f.amount || 0) : sum, 0);

      const tvaCol = facturesFiltres.reduce((sum, f) =>
        f.tva ? sum + parseFloat(f.tva || 0) : sum, 0);

      const depensesTotal = depensesFiltres.reduce((sum, d) =>
        sum + parseFloat(d.montant || 0), 0);

      const tvaDeduct = depensesFiltres.reduce((sum, d) =>
        d.tva ? sum + parseFloat(d.tva || 0) : sum, 0);

      setRevenus(revenusTotal);
      setDepenses(depensesTotal);
      setTvaCollectee(tvaCol);
      setTvaDeductible(tvaDeduct);
      setNet(revenusTotal - depensesTotal);
    };

    fetchData();
  }, [periode]);

  const filterByPeriode = (data, periode) => {
    const now = new Date();
    return data.filter(item => {
      const d = item.date?.toDate?.() || new Date(item.date);
      if (periode === '2025-T1') {
        return d >= new Date('2025-01-01') && d <= new Date('2025-03-31');
      }
      if (periode === '2025') {
        return d.getFullYear() === 2025;
      }
      // Ajouter d'autres cas
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
        <select className="ml-2 border rounded p-1" value={periode} onChange={e => setPeriode(e.target.value)}>
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