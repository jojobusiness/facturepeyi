import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc, getDoc, updateDoc, getDocs,
  collection, addDoc, Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import InvoiceLinesEditor from "../components/InvoiceLinesEditor";
import PdfLivePreview from "../components/PdfLivePreview";
import { computeTotals, normalizeLines } from "../utils/invoiceLines";

const STATUTS = [
  { value: "brouillon", label: "Brouillon" },
  { value: "envoyé",    label: "Envoyé" },
  { value: "accepté",   label: "Accepté" },
  { value: "refusé",    label: "Refusé" },
];

export default function EditDevis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { entreprise, entrepriseId } = useAuth();

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [lignes, setLignes] = useState(null);
  const [date, setDate] = useState("");
  const [validiteJours, setValiditeJours] = useState(30);
  const [status, setStatus] = useState("brouillon");
  const [numero, setNumero] = useState("");
  const [convertedToFacture, setConvertedToFacture] = useState(false);
  const [factureId, setFactureId] = useState(null);
  const [loading, setLoading] = useState(true);

  const defaultRate = entreprise?.tvaRate ?? 0;
  const mentionLegale = entreprise?.mentionLegale || "";

  useEffect(() => {
    if (!entrepriseId) return;
    getDocs(collection(db, "entreprises", entrepriseId, "clients"))
      .then((snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [entrepriseId]);

  useEffect(() => {
    if (!entrepriseId || !id) return;
    getDoc(doc(db, "entreprises", entrepriseId, "devis", id)).then((snap) => {
      if (!snap.exists()) { navigate("/dashboard/devis"); return; }
      const data = snap.data();
      setClientId(data.clientId || "");
      setLignes(normalizeLines(data).map((l) => ({
        description: l.description, quantite: l.quantite, prixUnitaire: l.prixUnitaire, tvaRate: l.tvaRate,
      })));
      setDate(data.date?.toDate().toISOString().split("T")[0] || "");
      setValiditeJours(data.validiteJours || 30);
      setStatus(data.status || "brouillon");
      setNumero(data.numero || "");
      setConvertedToFacture(data.convertedToFacture || false);
      setFactureId(data.factureId || null);
      setLoading(false);
    });
  }, [entrepriseId, id, navigate]);

  const selectedClient = clients.find((c) => c.id === clientId);

  const cleanLignes = () => (lignes || [])
    .filter((l) => l.description?.trim() || Number(l.prixUnitaire) > 0)
    .map((l) => ({
      description: l.description || "",
      quantite: Number(l.quantite) || 0,
      prixUnitaire: Number(l.prixUnitaire) || 0,
      tvaRate: Number(l.tvaRate) || 0,
    }));

  const dateValidite = useMemo(() => {
    const d = new Date(date || Date.now());
    d.setDate(d.getDate() + parseInt(validiteJours));
    return d;
  }, [date, validiteJours]);

  const previewCtx = useMemo(() => ({
    numero: numero || "Aperçu",
    date,
    dateValidite,
    status,
    lignes: lignes || [],
    tvaRate: defaultRate,
    mentionLegale,
    clientNom: selectedClient?.nom || "Client",
    clientAdresse: selectedClient?.adresse || "",
    clientCodePostal: selectedClient?.codePostal || "",
    clientVille: selectedClient?.ville || "",
    clientEmail: selectedClient?.email || "",
    entrepriseNom: entreprise?.nom || "Mon entreprise",
    entrepriseSiret: entreprise?.siret || "",
    entrepriseAdresse: entreprise?.adresse || "",
    entrepriseCodePostal: entreprise?.codePostal || "",
    entrepriseVille: entreprise?.ville || "",
    entrepriseTel: entreprise?.telephone || "",
    entrepriseEmail: entreprise?.emailContact || "",
  }), [numero, date, dateValidite, status, lignes, defaultRate, mentionLegale, selectedClient, entreprise]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cl = cleanLignes();
    if (cl.length === 0) return alert("Ajoutez au moins une ligne avec un montant.");
    try {
      const { totalHT, totalTVA, totalTTC } = computeTotals(normalizeLines({ lignes: cl, tvaRate: defaultRate }));
      const selectedClient = clients.find((c) => c.id === clientId);
      const dateObj = new Date(date);
      const dateExpiration = new Date(dateObj);
      dateExpiration.setDate(dateExpiration.getDate() + parseInt(validiteJours));

      await updateDoc(doc(db, "entreprises", entrepriseId, "devis", id), {
        clientId,
        clientNom: selectedClient?.nom || "",
        clientEmail: selectedClient?.email || "",
        lignes: cl,
        description: cl.map((l) => l.description).filter(Boolean).join(" + ").slice(0, 200),
        amountHT: totalHT,
        tva: totalTVA,
        totalTTC,
        tvaRate: cl[0]?.tvaRate ?? defaultRate,
        mentionLegale,
        date: Timestamp.fromDate(dateObj),
        dateExpiration: Timestamp.fromDate(dateExpiration),
        dateValidite: Timestamp.fromDate(dateExpiration),
        validiteJours: parseInt(validiteJours),
        status,
      });
      navigate("/dashboard/devis");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour.");
    }
  };

  const handleConvert = async () => {
    if (!window.confirm("Convertir ce devis en facture ?")) return;
    const cl = cleanLignes();
    if (cl.length === 0) return alert("Le devis ne contient aucune ligne.");
    try {
      const { totalHT, totalTVA, totalTTC } = computeTotals(normalizeLines({ lignes: cl, tvaRate: defaultRate }));
      const selectedClient = clients.find((c) => c.id === clientId);

      const ref = await addDoc(collection(db, "entreprises", entrepriseId, "factures"), {
        clientId,
        clientNom: selectedClient?.nom || "",
        clientEmail: selectedClient?.email || "",
        lignes: cl,
        description: cl.map((l) => l.description).filter(Boolean).join(" + ").slice(0, 200),
        amountHT: totalHT,
        tva: totalTVA,
        totalTTC,
        tvaRate: cl[0]?.tvaRate ?? defaultRate,
        mentionLegale,
        date: Timestamp.now(),
        status: "en attente",
        createdAt: Timestamp.now(),
        entrepriseId,
        sourceDevisId: id,
      });

      await updateDoc(doc(db, "entreprises", entrepriseId, "devis", id), {
        convertedToFacture: true,
        factureId: ref.id,
        status: "accepté",
      });

      navigate(`/dashboard/facture/modifier/${ref.id}`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la conversion.");
    }
  };

  if (loading || lignes === null) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement...</div>;
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <main className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0d1b3e]">Modifier le devis</h2>
        {convertedToFacture && (
          <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full">Converti en facture</span>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div>
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} required className={inputClass}>
                <option value="">-- Sélectionner un client --</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Lignes du devis</label>
              <InvoiceLinesEditor lignes={lignes} setLignes={setLignes} defaultRate={defaultRate} />
            </div>

            {mentionLegale && (
              <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 italic">{mentionLegale}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Date du devis</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Validité</label>
                <select value={validiteJours} onChange={(e) => setValiditeJours(e.target.value)} className={inputClass}>
                  <option value={15}>15 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={45}>45 jours</option>
                  <option value={60}>60 jours</option>
                  <option value={90}>90 jours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition">
              Enregistrer les modifications
            </button>
          </form>

          {!convertedToFacture && (
            <div className="mt-4 bg-white border border-emerald-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600 text-lg font-bold">→</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#0d1b3e]">Convertir en facture</p>
                  <p className="text-xs text-gray-400 mt-0.5">Le devis sera marqué comme accepté et une facture sera créée automatiquement.</p>
                </div>
                <button onClick={handleConvert} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition flex-shrink-0">
                  Convertir
                </button>
              </div>
            </div>
          )}

          {convertedToFacture && factureId && (
            <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-indigo-700">Devis converti en facture</p>
                <button onClick={() => navigate(`/dashboard/facture/modifier/${factureId}`)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                  Voir la facture
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-4">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Aperçu en direct</p>
          <PdfLivePreview invoice={previewCtx} kind="devis" />
        </div>
      </div>
    </main>
  );
}
